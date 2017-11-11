const path = require('path')
const async = require('async')
const ProgressBar = require('progress')
const glob = require('glob')
const YAML = require('yamljs')
const rp = require('request-promise')

module.exports = (message, server) => {
  console.log('EVENT_AGGREGATOR_ANSWERS_POSTGRES', message)
  const databaseDir = path.resolve(__dirname, '../../data/collector/postgres')
  const files = glob.sync(databaseDir + '/answers/**/*.yml')
  const bar = new ProgressBar('  aggregators [:bar] :percent :etas', {width: 40, total: files.length})
  async.eachLimit(files, 50, (file, next) => {
    aggregator(server.r, file, () => {
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
