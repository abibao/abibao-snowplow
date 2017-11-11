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
    request.server.bus.send('EVENT_AGGREGATOR_ANSWERS_POSTGRES', message)
    const body = {
      'username': 'aggregatorAnswersPostgresEvent',
      'text': '[' + new Date() + '] - [EVENT_AGGREGATOR_ANSWERS_POSTGRES] has just started'
    }
    return reply(body)
  }
}
