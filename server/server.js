let express = require('express')
let app = express()
let db = require('./database.js')
let session = require('express-session')
let uuid = require('uuid/v4')
let bodyParser = require('body-parser')
let FileStore = require('session-file-store')(session)
let passport = require('passport')
let LocalStrategy = require('passport-local').Strategy


//TODO: error handling

let users = [ {id: 'abc', email:'test@test.com', password:'password'} ]

passport.use(new LocalStrategy(
 { username: 'email' },
 { email, password, done } => {
   console.log('Inside local strategy callback')
   //Find a user in the database here
   //based on their username or email
   let user = users[0]
   if (email === user.email && password === user.password) {
     console.log('Local strategy returns true')
     return done(null, user)
   }
 }
))

passport.serializeUser((user, done) => {
  console.log('Inside serializeUser callback. UserId is saved to the session file here.')
  done(null, user.id)
})

let allowedOrigins = [
  'http://localhost:8081'
]

app.use(bodyParser.urlencoded({ extended: false }))

app.use(session({
  genId: (req) => {
    return uuid()
  },
  store: new FileStore(),
  secret: 'abcdefghj',
  resave: false,
  saveUninitialized: true
}))

app.use((req, res, next) => {
  if (allowedOrigins.includes(req.get('origin'))) {
    res.set('access-control-allow-origin', req.get('origin'))
  }
  res.set('access-control-allow-headers', 'content-type')
  next()
})

app.get('/', (req, res) => {
  res.send(`your session id ${req.sessionID}`)
})

app.post('/login', async (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    console.log(`req.user: ${JSON.stringify(req.user)}`)
    req.login(user, (err) => {
      return res.send('You were authenticated & logged in.')
    })
  })(req, res, next)
})

app.get('/authrequired', (req, res) => {
  if (req.isAuthenticated()) {
    res.send('Authenticated.')
  } else {
    res.redirect('/')
  }
})

app.get('/item/:id', async (req, res) => {
  let unicode = req.params.id.toLowerCase()
  let emoji = await db.getEmojiByUnicode(unicode, false)
  res.status(200).json(emoji)
})

app.get('/forsale', async (req, res) =>  {
  res.status(200).json(await db.getForSale())
})

app.post('/forsale/updateprice', async (req, res) => {
  let updatedItem = await db.updateMarketItem(req.body.id, req.body.price)
  res.status(200).json(updatedItem)
})

app.listen(8080, () => {
  console.log('Listening on localhost:8080')
})
