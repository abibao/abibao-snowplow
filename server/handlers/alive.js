module.exports = {
  auth: false,
  handler (request, reply) {
    return reply({
      name: 'alive'
    })
  }
}
