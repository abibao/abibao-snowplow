const path = require('path')
const async = require('async')
const _ = require('lodash')
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
  surveys: glob(rethinkdbDir + '/surveys/**/*.yml'),
  campaigns: glob(rethinkdbDir + '/campaigns/**/*.yml'),
  choices: glob(rethinkdbDir + '/campaigns_items_choices/**/*.yml'),
  campaignsNew: glob(postgresDir + '/campaigns/**/*.yml')
}
let campaigns = {}
let campaignsNew = {}
let choices = {}
let results = {}

const resolveAnswers = function () {
  return new Promise((resolve, reject) => {
    Promise.props(promises)
      .then((props) => {
        results = props
        console.log('load yaml campaigns')
        async.mapLimit(results.campaigns, 1, (file, next) => {
          let content = YAML.load(file)
          campaigns[content.id] = content
          next()
        }, () => {
          console.log('... yaml campaigns done')
          return false
        })
      })
      .then(() => {
        console.log('load yaml choices')
        async.mapLimit(results.choices, 1, (file, next) => {
          let content = YAML.load(file)
          choices[content.id] = content
          next()
        }, () => {
          console.log('... yaml choices done')
          return false
        })
      })
      .then(() => {
        console.log('load yaml campaigns new')
        async.mapLimit(results.campaignsNew, 1, (file, next) => {
          let content = YAML.load(file)
          let name = _.snakeCase(content.name)
          campaignsNew[name] = content.id
          campaignsNew['sondage_profilage_01'] = campaignsNew['abibao_profilage_01']
          campaignsNew['sondage_profilage_02'] = campaignsNew['abibao_profilage_02']
          campaignsNew['sondage_profilage_03'] = campaignsNew['abibao_profilage_03']
          campaignsNew['sondage_profilage_04'] = campaignsNew['abibao_profilage_04']
          next()
        }, () => {
          console.log('... yaml campaigns new done')
          return false
        })
      })
      .then(() => {
        console.log('aggregators')
        const bar = new ProgressBar('  aggregators [:bar] :percent :etas', { width: 40, total: results.surveys.length })
        async.mapLimit(results.surveys, 1, (file, next) => {
          YAML.load(file, (survey) => {
            r.table('individuals').filter({uuid: survey.individual})
              .then((individuals) => {
                if (individuals.length === 1) {
                  let individual = individuals[0]
                  let keys = Object.keys(survey.answers)
                  async.map(keys, key => {
                    let items = []
                    if (_.isArray(survey.answers[key])) {
                      async.map(survey.answers[key], k => {
                        items.push({
                          individual: individual.urn || false,
                          campaign_id: campaignsNew[_.snakeCase(campaigns[survey.campaign].name)] || false,
                          campaign_name: campaigns[survey.campaign].name || false,
                          question: key,
                          answer: (choices[k]) ? choices[k].prefix + '_' + choices[k].suffix : k,
                          createdAt: survey.createdAt,
                          updatedAt: survey.modifiedAt
                        })
                      })
                      individual[key] = items
                    } else {
                      let campaignId = _.snakeCase(campaigns[survey.campaign].name)
                      individual[key] = {
                        individual: individual.urn || individual.email,
                        campaign_id: campaignsNew[campaignId] || false,
                        campaign_name: campaigns[survey.campaign].name || false,
                        question: key,
                        answer: (choices[survey.answers[key]]) ? choices[survey.answers[key]].prefix + '_' + choices[survey.answers[key]].suffix : survey.answers[key],
                        createdAt: survey.createdAt,
                        updatedAt: survey.modifiedAt
                      }
                    }
                  })
                  return r.table('individuals').filter({uuid: survey.individual}).update(individual)
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
r.table('answers').delete()
.then(() => {
  return resolveAnswers()
})
.then(() => {
  console.log('DONE')
  process.exit(0)
})
.catch(error => {
  console.log(error)
  process.exit(1)
})
