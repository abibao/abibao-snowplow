'use strict'

const path = require('path')
const nconf = require('nconf')

nconf.argv().env().file({ file: 'nconf.json' })

module.exports = {
  host: nconf.get('ABIBAO_SERVICE_HOST') || '0.0.0.0',
  port: nconf.get('ABIBAO_SERVICE_PORT') || 4040,
  rabbitmq: {
    host: nconf.get('ABIBAO_RABBITMQ_HOST') || 'localhost',
    port: nconf.get('ABIBAO_RABBITMQ_PORT') || 5672,
    user: nconf.get('ABIBAO_RABBITMQ_USER') || 'guest',
    pass: nconf.get('ABIBAO_RABBITMQ_PASSWORD') || 'guest'
  },
  postgres: {
    host: nconf.get('ABIBAO_POSTGRES_HOST') || 'localhost',
    port: nconf.get('ABIBAO_POSTGRES_PORT') || 5432,
    database: nconf.get('ABIBAO_POSTGRES_DB') || 'infra',
    username: nconf.get('ABIBAO_POSTGRES_USER') || 'infra',
    password: nconf.get('ABIBAO_POSTGRES_PASSWORD') || 'infra',
  },
  rethink: {
    host: nconf.get('ABIBAO_RETHINK_HOST') || 'localhost',
    port: nconf.get('ABIBAO_RETHINK_PORT') || 28115,
    database: nconf.get('ABIBAO_RETHINK_DB') || 'infra',
    username: nconf.get('ABIBAO_RETHINK_USER') || 'infra',
    password: nconf.get('ABIBAO_RETHINK_PASSWORD') || 'infra',
  }
}
