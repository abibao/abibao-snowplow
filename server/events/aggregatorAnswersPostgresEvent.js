const path = require('path')
const async = require('async')
const ProgressBar = require('progress')
const glob = require('glob-promise')
const YAML = require('yamljs')
const Promise = require('bluebird')
const rp = require('request-promise')

module.exports = (message, server) => {
  console.log('EVENT_AGGREGATOR_ANSWERS_POSTGRES', message)
  console.log('START')
  resolveAnswers(server.r)
    .then(() => {
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

const resolveAnswers = function (r) {
  return new Promise((resolve, reject) => {
    const postgresDir = path.resolve(__dirname, '../../data/collector/postgres')
    glob(postgresDir + '/answers/**/*.yml')
      .then((files) => {
        console.log('aggregators')
        const bar = new ProgressBar('  aggregators [:bar] :percent :etas', { width: 40, total: files.length })
        async.mapLimit(files, 1, (file, next) => {
          YAML.load(file, (survey) => {
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
                  return false // r.db('aggregators').table('answers').insert(survey)
                }
              })
              .then(() => {
                bar.tick()
                next(null)
              })
              .catch(error => {
                bar.tick()
                next(error)
              })
          })
        }, error => {
          if (error) return reject(error)
          resolve()
        })
      })
      .catch(error => {
        reject(error)
      })
  })
}
