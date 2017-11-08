const path = require('path')
const async = require('async')
const ProgressBar = require('progress')
const glob = require('glob-promise')
const YAML = require('yamljs')

let options = {
  db: 'aggregators',
  silent: true
}
const r = require('thinky')(options).r

const cacheDir = path.resolve(__dirname, 'data/collector/rethinkdb')

glob(cacheDir + '/surveys/**/*.yml')
  .then(files => {
    const bar = new ProgressBar('  aggregators [:bar] :percent :etas', { width: 40, total: files.length })
    async.mapLimit(files, 10, (file, next) => {
      let survey = YAML.load(file)
      let update = {}
      Object.keys(survey.answers).map(key => {
        update[key] = survey.answers[key]
      })
      r.table('individuals').filter({idRethinkdb: survey.individual}).update(update)
        .then((results) => {
          bar.tick()
          next(null)
        })
        .catch(error => {
          bar.tick()
          next(error)
        })
    }, error => {
      if (error) {
        console.log(error)
        process.exit(1)
      } else {
        process.exit(0)
      }
    })
  })
  .catch(error => {
    console.log(error)
    process.exit(1)
  })
