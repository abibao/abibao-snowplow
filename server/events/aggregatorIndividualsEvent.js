const path = require('path')
const async = require('async')
const ProgressBar = require('progress')
const glob = require('glob')
const YAML = require('yamljs')
const rp = require('request')

module.exports = (message, server) => {
  console.log('EVENT_AGGREGATOR_INDIVIDUALS', message)
  const database = message.source
  const databaseConvert = {
    rethinkdb: {
      key: 'uuid',
      value: 'id'
    },
    postgres: {
      key: 'urn',
      value: 'urn'
    }
  }
  const databaseDir = path.resolve(__dirname, '../../data/collector/' + database)
  const files = glob.sync(databaseDir + '/individuals/**/*.yml')
  const bar = new ProgressBar('  aggregators [:bar] :percent :etas', {width: 40, total: files.length})
  async.eachLimit(files, 50, (file, next) => {
    aggregator(server.r, file, databaseConvert[database].key, databaseConvert[database].value, () => {
      bar.tick()
      next()
    })
  }, () => {
    console.log('DONE callback')
    if (message.callback !== false) {
      rp({
        method: 'POST',
        uri: message.callback
      })
    }
  })
}

const aggregator = function (r, file, key, value, callback) {
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
      callback()
      return null
    })
    .catch(() => {
      callback()
      return null
    })
}
