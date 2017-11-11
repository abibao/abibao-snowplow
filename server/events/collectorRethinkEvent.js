const path = require('path')
const fse = require('fs-extra')
const async = require('async')
const YAML = require('yamljs')
const rp = require('request-promise')

module.exports = (message, server) => {
  console.log('EVENT_COLLECTOR_RETHINK', message)
  const cacheDir = path.resolve(__dirname, '../../data/collector/rethinkdb')
  fse.ensureDirSync(cacheDir)
  server.r.table(message.table).skip(message.skip).limit(message.limit)
    .then(function (result) {
      const items = result
      async.mapSeries(items, function (item, next) {
        const dir = path.resolve(cacheDir, message.table)
        fse.ensureDirSync(dir)
        let filepath = path.resolve(dir, item.id + '.yml')
        if (message.table === 'individuals') {
          let year = new Date(item.createdAt).getUTCFullYear()
          let month = new Date(item.createdAt).getUTCMonth()
          let day = new Date(item.createdAt).getUTCDate()
          filepath = path.resolve(dir, year.toString(), ('0' + (month + 1)).slice(-2), ('0' + day).slice(-2), item.id + '.yml')
          fse.ensureFileSync(filepath)
        }
        if (message.table === 'surveys') {
          let year = new Date(item.createdAt).getUTCFullYear()
          let month = new Date(item.createdAt).getUTCMonth()
          let day = new Date(item.createdAt).getUTCDate()
          filepath = path.resolve(dir, year.toString(), ('0' + (month + 1)).slice(-2), ('0' + day).slice(-2), item.individual, item.id + '.yml')
          fse.ensureFileSync(filepath)
        }
        fse.writeFileSync(filepath, YAML.stringify(item, 5))
        next()
      }, function (err) {
        if (err) { return false }
        return server.r.table(message.table).count()
          .then(function (count) {
            if (message.skip + message.limit < count) {
              message.skip += message.limit
              server.bus.send('EVENT_COLLECTOR_RETHINK', message)
              return false
            } else {
              // callback
              if (message.callback !== false) {
                rp({
                  method: 'POST',
                  uri: message.callback
                })
              }
              return false
            }
          })
      })
    })
    .catch(function () {
      return false
    })
}
