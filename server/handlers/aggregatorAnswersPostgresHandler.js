const path = require('path')
const glob = require('glob')
const _ = require('lodash')
const Joi = require('joi')

module.exports = {
  auth: false,
  validate: {
    payload: {
      callback: Joi.string().optional()
    }
  },
  handler (request, reply) {
    const databaseDir = path.resolve(__dirname, '../../data/collector/postgres')
    const files = glob.sync(databaseDir + '/answers/**/')
    let data = _.map(files, (file) => {
      let items = _.remove(file.split(databaseDir)[1].split('/'), item => { return item !== '' })
      if (items.length === 4) {
        return items.join('/')
      } else {
        return false
      }
    })
    let filterData = _.remove(data, datum => { return datum !== false })
    const message = {
      data: filterData,
      callback: request.payload.callback || false
    }
    request.server.bus.send('EVENT_AGGREGATOR_ANSWERS_POSTGRES', message)
    const body = {
      'username': 'aggregatorAnswersPostgresEvent',
      'text': '[' + new Date() + '] - [EVENT_AGGREGATOR_ANSWERS_POSTGRES] has just started'
    }
    return reply(body)
  }
}
