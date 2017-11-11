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

const postgresDir = path.resolve(__dirname, 'data/collector/postgres')

let promises = {
  surveys: glob(postgresDir + '/answers/2017/11/**/*.yml')
}
let results = {}

const resolveAnswers = function () {
  return new Promise((resolve, reject) => {
    Promise.props(promises)
      .then((props) => {
        results = props
        return false
      })
      .then(() => {
        console.log('aggregators')
        const bar = new ProgressBar('  aggregators [:bar] :percent :etas', { width: 40, total: results.surveys.length })
        async.mapLimit(results.surveys, 1, (file, next) => {
          YAML.load(file, (survey) => {
            r.table('individuals').filter({urn: survey.individual})
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
                  return r.table('individuals').filter({urn: survey.individual}).update(individual)
                } else {
                  return false // r.table('answers').insert(survey)
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

console.log('START')
resolveAnswers()
  .then(() => {
    console.log('DONE')
    process.exit(0)
  })
  .catch(error => {
    console.log(error)
    process.exit(1)
  })
