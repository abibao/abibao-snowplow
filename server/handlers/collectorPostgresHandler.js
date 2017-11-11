const Joi = require('joi')

module.exports = {
  auth: false,
  validate: {
    payload: {
      table: Joi.string().valid(['individuals', 'answers', 'campaigns', 'surveys']).required(),
      callback: Joi.string().optional()
    }
  },
  handler (request, reply) {
    const message = {
      callback: request.payload.callback || false,
      table: request.payload.table,
      offset: 0
    }
    request.server.bus.send('EVENT_COLLECTOR_POSTGRES', message)
    const body = {
      'username': 'collectorPostgresEvent',
      'text': '[' + new Date() + '] - [EVENT_COLLECTOR_POSTGRES] has just started (' + message.table + ')'
    }
    return reply(body)
  }
}
