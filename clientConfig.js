if (process.env.NODE_ENV == 'dev') {
  module.exports = {
    apiUrl: 'http://localhost:8080'
  }
} else {
  module.exports = {
    apiUrl: 'http://api.emojipet.com'
  }
}
