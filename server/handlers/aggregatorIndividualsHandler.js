const Joi = require('joi')

module.exports = {
  auth: false,
  validate: {
    payload: {
      callback: Joi.string().optional()
    }
  },
  handler (request, reply) {
    const message = {
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
