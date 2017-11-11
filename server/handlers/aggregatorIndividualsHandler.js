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
    const message = {
      source: request.payload.source,
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
