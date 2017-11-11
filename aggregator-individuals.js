const path = require('path')
const async = require('async')
const ProgressBar = require('progress')
const glob = require('glob-promise')
const YAML = require('yamljs')
const Promise = require('bluebird')

let options = {
  db: 'aggregators',
  silent: true
}
const r = require('thinky')(options).r

const rethinkdbDir = path.resolve(__dirname, 'data/collector/rethinkdb')
const postgresDir = path.resolve(__dirname, 'data/collector/postgres')

let promises = {
  rethinkdb: glob(rethinkdbDir + '/individuals/2017/11/**/*.yml'),
  postgres: glob(postgresDir + '/individuals/2017/11/**/*.yml')
}

const aggregator = function (files, key, value) {
  return new Promise((resolve, reject) => {
    const bar = new ProgressBar('  aggregators [:bar] :percent :etas', {width: 40, total: files.length})
    async.mapLimit(files, 10, (file, next) => {
      let individual = YAML.load(file)
      r.table('individuals')
        .then(() => {
          return r.table('individuals').insert({id: individual.email})
        })
        .then(() => {
          let data = {}
          data[key] = individual[value]
          data.createdAt = new Date(individual.createdAt)
          return r.table('individuals').get(individual.email).update(data)
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

let allFiles = {}
Promise.props(promises)
  .then(files => {
    allFiles = files
    console.log('START', 'rethinkdb', allFiles.rethinkdb.length)
    return aggregator(allFiles.rethinkdb, 'uuid', 'id')
  })
  .then(() => {
    console.log('START', 'postgres', allFiles.postgres.length)
    return aggregator(allFiles.postgres, 'urn', 'urn')
  })
  .then(() => {
    console.log('DONE')
    process.exit(0)
  })
  .catch(error => {
    console.log(error)
    process.exit(1)
  })
