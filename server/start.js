const Hapi = require('hapi')
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

let conf = require('../config/default')

// Rethink
let options = {
  host: conf.rethink.host,
  port: conf.rethink.port,
  db: conf.rethink.database,
  user: conf.rethink.user,
  password: conf.rethink.password,
  silent: true
}
server.r = require('thinky')(options).r

server.connection({
  host: conf.host,
  port: conf.port
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
  let url = 'amqp://'
  if (conf.rabbitmq.user && conf.rabbitmq.pass) {
    url = url + conf.rabbitmq.user + ':' + conf.rabbitmq.pass + '@'
  }
  url = url + conf.rabbitmq.host + ':' + conf.rabbitmq.port
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
