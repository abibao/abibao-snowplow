const path = require('path')
const glob = require('glob')
const _ = require('lodash')
const Joi = require('joi')

module.exports = {
  auth: false,
  validate: {
    payload: {
      source: Joi.string().valid(['rethinkdb', 'postgres']).required(),
      callback: Joi.string().optional()
    }
  },
  handler (request, reply) {
    const databaseDir = path.resolve(__dirname, '../../data/collector', request.payload.source)
    const files = glob.sync(databaseDir + '/individuals/**/')
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
      source: request.payload.source,
      data: filterData,
      callback: request.payload.callback || false
    }
    request.server.bus.send('EVENT_AGGREGATOR_INDIVIDUALS', message)
    const body = {
      'username': 'aggregatorIndividualsEvent',
      'text': '[' + new Date() + '] - [EVENT_AGGREGATOR_INDIVIDUALS] has just started'
    }
    return reply(body)
  }
}
