const path = require('path')
const async = require('async')
const glob = require('glob')
const YAML = require('yamljs')
const rp = require('request-promise')

module.exports = (message, server) => {
  const databaseDir = path.resolve(__dirname, '../../data/collector/postgres', message.data.shift())
  const files = glob.sync(databaseDir + '/*.yml')
  console.log('EVENT_AGGREGATOR_ANSWERS_POSTGRES', {data: message.data.length, files: files.length, callback: message.callback})
  async.eachLimit(files, 10, (file, next) => {
    aggregator(server.r, file, () => {
      next()
    })
  }, () => {
    if (message.data.length > 0) {
      return server.bus.send('EVENT_AGGREGATOR_ANSWERS_POSTGRES', message)
    }
    if (message.callback !== false) {
      rp({
        method: 'POST',
        uri: message.callback
      })
    }
  })
}

const aggregator = function (r, file, callback) {
  let survey = YAML.load(file)
  r.db('aggregators').table('individuals').filter({urn: survey.individual})
    .then((individuals) => {
      if (individuals.length === 1) {
        let individual = individuals[0]
        individual[survey.question] = {
          individual: survey.individual,
          campaign_id: survey.campaign_id,
          campaign_name: survey.campaign_name,
          question: survey.question,
          answer: survey.answer,
          createdAt: survey.createdAt,
          updatedAt: survey.modifiedAt
        }
        return r.db('aggregators').table('individuals').filter({urn: survey.individual}).update(individual)
      } else {
        return null
      }
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
