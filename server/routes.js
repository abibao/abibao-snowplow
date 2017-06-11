exports.endpoints = [
  { method: 'GET', path: '/api/alive', config: require('./handlers/alive') },
  { method: 'POST', path: '/api/collector/rethinkdb', config: require('./handlers/collectorRethinkHandler') },
  { method: 'POST', path: '/api/collector/postgres', config: require('./handlers/collectorPostgresHandler') }
]
