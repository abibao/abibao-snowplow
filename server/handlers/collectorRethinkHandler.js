const Joi = require('joi')

module.exports = {
  auth: false,
  validate: {
    payload: {
      table: Joi.string().valid(['individuals', 'surveys', 'campaigns', 'campaigns_items', 'campaigns_items_choices']).required(),
      callback: Joi.string()
    }
  },
  handler (request, reply) {
    const message = {
      callback: request.payload.callback || false,
      table: request.payload.table,
      skip: 0,
      limit: 100
    }
    request.server.bus.send('EVENT_COLLECTOR_RETHINK', message)
    const body = {
      'username': 'collectorRethinkHandler',
      'text': '[' + new Date() + '] - [EVENT_COLLECTOR_RETHINK] has just started (' + message.table + ')'
    }
    return reply(body)
  }
}
