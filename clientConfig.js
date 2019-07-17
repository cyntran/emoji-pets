if (process.env.NODE_ENV.startsWith('dev')) {
  module.exports = {
    apiUrl: 'http://localhost:8080'
  }
}

if (process.env.NODE_ENV.startsWith('prod')) {
  module.exports = {
    apiUrl: 'http://api.emojipet.com'
  }
}

console.log(process.env.NODE_ENV)
