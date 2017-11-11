const chai = require('chai')
const expect = chai.expect

const config = require('../../config/default')

describe('configuration', () => {
  it('should load', done => {
    expect(config.host).to.equal('0.0.0.0')
    expect(config.port).to.equal(4040)
    expect(config.rabbitmq).to.be.an('object')
    expect(config.postgres).to.be.an('object')
    expect(config.rethink).to.be.an('object')
    done()
  })
})
