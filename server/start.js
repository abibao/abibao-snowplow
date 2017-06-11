const Hapi = require('hapi')
const YAML = require('yamljs')
const path = require('path')
const pg = require('pg')

const Routes = require('./routes')

const collectorRethinkEvent = require('./events/collectorRethinkEvent')
const collectorPostgresEvent = require('./events/collectorPostgresEvent')

let server = new Hapi.Server({
  debug: false,
  connections: {
    routes: {
      cors: true
    }
  }
})

let conf = YAML.load(path.resolve(__dirname, 'dump.yml'))

// Rethink
let options = {
  host: conf.rethinkdb.host,
  port: conf.rethinkdb.port,
  db: conf.rethinkdb.database,
  user: conf.rethinkdb.user,
  password: conf.rethinkdb.password,
  silent: true
}
server.r = require('thinky')(options).r

server.connection({
  host: '0.0.0.0',
  port: 4040
})

const pool = new pg.Pool(conf.postgres)
server.p = false
pool.connect((error, result, done) => {
  if (error) {
    console.log(error)
    return process.exit(1)
  }
  console.log('connected to postgres')
  server.p = result
})

server.route(Routes.endpoints)

server.start((error) => {
  if (error) {
    console.log(error)
    process.exit(1)
  }
  console.log('Server running at:', server.info.uri)
  const url = 'amqp://guest:guest@rabbitmq:5672'
  server.bus = require('servicebus').bus({url})
  server.bus.on('error', (error) => {
    console.log(error)
    process.exit(1)
  })
  server.bus.on('ready', () => {
    server.bus.listen('EVENT_COLLECTOR_RETHINK', (message) => {
      collectorRethinkEvent(message, server)
    })
    server.bus.listen('EVENT_COLLECTOR_POSTGRES', (message) => {
      collectorPostgresEvent(message, server)
    })
    console.log('Bus running at:', url)
  })
})
