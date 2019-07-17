function AccessError () {
  this.message = 'Server error. Oops-- Try again later!'
  this.name = 'AccessError'
  console.error('Object cannot be retrieved')
}

function UpdateError () {
  this.message = 'Server error. Oops-- Try again later!'
  this.name = 'UpdateError'
  console.error('Object cannot be saved')
}

UpdateError.prototype = new Error()
AccessError.prototype = new Error()

module.exports = {
  AccessError,
  UpdateError
}
