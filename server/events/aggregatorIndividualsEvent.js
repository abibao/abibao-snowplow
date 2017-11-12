const path = require('path')
const async = require('async')
const glob = require('glob')
const YAML = require('yamljs')
const rp = require('request-promise')

module.exports = (message, server) => {
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
  const databaseDir = path.resolve(__dirname, '../../data/collector', message.source, message.data.shift())
  const files = glob.sync(databaseDir + '/*.yml')
  console.log('EVENT_AGGREGATOR_INDIVIDUALS', {data: message.data.length, files: files.length, callback: message.callback})
  async.eachLimit(files, 10, (file, next) => {
    aggregator(server.r, file, databaseConvert[message.source].key, databaseConvert[message.source].value, () => {
      next()
    })
  }, () => {
    if (message.data.length > 0) {
      return server.bus.send('EVENT_AGGREGATOR_INDIVIDUALS', message)
    }
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
