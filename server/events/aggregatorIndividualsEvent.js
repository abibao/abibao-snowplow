const path = require('path')
const async = require('async')
const ProgressBar = require('progress')
const glob = require('glob-promise')
const YAML = require('yamljs')
const Promise = require('bluebird')
const rp = require('request-promise')

module.exports = (message, server) => {
  console.log('EVENT_AGGREGATOR_INDIVIDUALS', message)
  const rethinkdbDir = path.resolve(__dirname, '../../data/collector/rethinkdb')
  const postgresDir = path.resolve(__dirname, '../../data/collector/postgres')
  let promises = {
    rethinkdb: glob(rethinkdbDir + '/individuals/**/*.yml'),
    postgres: glob(postgresDir + '/individuals/**/*.yml')
  }
  let allFiles = {}
  Promise.props(promises)
    .then(files => {
      allFiles = files
      console.log('START', 'rethinkdb', allFiles.rethinkdb.length)
      return aggregator(server.r, allFiles.rethinkdb, 'uuid', 'id')
    })
    .then(() => {
      console.log('START', 'postgres', allFiles.postgres.length)
      return aggregator(server.r, allFiles.postgres, 'urn', 'urn')
    })
    .then(() => {
      // callback
      console.log('DONE callback')
      if (message.callback !== false) {
        rp({
          method: 'POST',
          uri: message.callback
        })
      }
    })
    .catch(() => {
      console.log('DONE callback (error)')
      if (message.callback !== false) {
        rp({
          method: 'POST',
          uri: message.callback
        })
      }
    })
}

const aggregator = function (r, files, key, value) {
  return new Promise((resolve, reject) => {
    if (files.length === 0) return resolve()
    console.log('...', 'aggregator', files.length)
    const bar = new ProgressBar('  aggregators [:bar] :percent :etas', {width: 40, total: files.length})
    async.mapLimit(files, 10, (file, next) => {
      let individual = YAML.load(file)
      r.db('aggregators').table('individuals')
        .then(() => {
          return r.db('aggregators').table('individuals').insert({id: individual.email})
        })
        .then(() => {
          let data = {}
          data[key] = individual[value]
          data.createdAt = new Date(individual.createdAt)
          return r.db('aggregators').table('individuals').get(individual.email).update(data)
        })
        .then(() => {
          bar.tick()
          next(null)
        })
        .catch(error => {
          bar.tick()
          next(error)
        })
    }, error => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}
