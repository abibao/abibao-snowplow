const legit = require('legit')
const async = require('async')

const conf = require('./config/default')

// Rethink
let options = {
  host: conf.rethink.host,
  port: conf.rethink.port,
  db: conf.rethink.database,
  user: conf.rethink.user,
  password: conf.rethink.password,
  silent: true
}
const r = require('thinky')(options).r

console.log('START')
r.db('aggregators').table('individuals').then((individuals) => {
  async.mapLimit(individuals, 1, (individual, next) => {
    console.log(individual.id)
    legit(individual.id, function (error, validation, addresses) {
      if (error) console.log('... ', individual.id, error.toString())
      setTimeout(next, 1000)
    }, () => {
      console.log('DONE')
      process.exit(0)
    })
  })
})
