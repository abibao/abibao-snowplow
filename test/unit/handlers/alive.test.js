const chai = require('chai')
const expect = chai.expect

const handler = require('../../../server/handlers/alive').handler

describe('handlers/alive', () => {
  it('should success', done => {
    handler({}, (message) => {
      expect(message.name).to.equal('alive')
      done()
    })
  })
})
