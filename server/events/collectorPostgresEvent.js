const path = require('path')
const fse = require('fs-extra')
const async = require('async')
const YAML = require('yamljs')
const Promise = require('bluebird')
const rp = require('request-promise')

const ensureFileSync = Promise.promisify(fse.ensureFile)
const writeFileSync = Promise.promisify(fse.writeFile)

module.exports = (message, server) => {
  console.log('EVENT_COLLECTOR_POSTGRES', message)
  const cacheDir = path.resolve(__dirname, '../../data/collector/postgres')
  fse.ensureDirSync(cacheDir)
  server.p.query('SELECT * FROM ' + message.table + ' LIMIT 1000 OFFSET $1::integer', [message.offset], (error, result) => {
    if (error) {
      console.log(error)
      return false
    }
    async.mapLimit(result.rows, 50, function (item, next) {
      let year = new Date(item.updatedAt).getUTCFullYear()
      let month = new Date(item.updatedAt).getUTCMonth()
      let day = new Date(item.updatedAt).getUTCDate()
      let filepath = path.resolve(cacheDir, message.table, year.toString(), ('0' + (month + 1)).slice(-2), ('0' + day).slice(-2), item.id + '.yml')
      ensureFileSync(filepath).then(() => {
        writeFileSync(filepath, YAML.stringify(item, 10))
      }).then(() => {
        next()
      }).catch(next)
    }, () => {
      if (result.rows.length !== 0) {
        message.offset += 999
        server.bus.send('EVENT_COLLECTOR_POSTGRES', message)
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
}
