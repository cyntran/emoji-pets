let express = require('express')
let db = require('./database.js')
let session = require('express-session')
let uuid = require('uuid/v4')
let bodyParser = require('body-parser')
let passport = require('passport')
let LocalStrategy = require('passport-local').Strategy
let RedisStore = require('connect-redis')(session)
let bcrypt = require('bcrypt')
let crypto = require('crypto')


//TODO: error handling

// takes data from post request and finds matching
// user in the database to check credentials match
// return back to /login callback with user object.
// local strategy uses a username and password to authenticate
// a user, but we use an email address instead of the username, so we
// created an alias.
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
   console.log('Inside local strategy callback')
   let user = await db.getUserByEmail(email)
   console.log('user', user)

   if (!user) {
     return done(null, false, { message: 'Email not registered.' })
   }

   bcrypt.compare(password, user.hash, (err, isMatch) => {
     console.log('isMatch', isMatch)
     if (err) {
       done(err)
     }
     if (isMatch) {
       return done(null, user)
     } else {
       return done(null, false, { message: 'Wrong password or email' })
     }
   })
  }
))

// saves user id with session id in store.
passport.serializeUser((user, done) => {
  console.log('UserId is saved to the session file here.')
  done(null, user.id)
})

// finds user id by matching session id to
// the session file store and retrieved user
passport.deserializeUser(async (id, done) => {
  console.log('Deserializing user and retrieving user')
  const user = await db.getUserById(id)
  const usrToRtn = user.id === id ? user : false
  done(null, usrToRtn)
})

let app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(session({
  genId: (req) => {
    return uuid()
  },
  store: new RedisStore({
    host: 'localhost',
    port: 6379
  }),
  secret: 'abcdefghj',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}))
app.use(passport.initialize());
app.use(passport.session());

// Enable CORS
let allowedOrigins = [
  'http://localhost:8081'
]

app.use((req, res, next) => {
  if (allowedOrigins.includes(req.get('origin'))) {
    res.set('access-control-allow-origin', req.get('origin'))
  }
  res.set('access-control-allow-headers', 'content-type')
  res.set('access-control-allow-credentials', true)
  next()
})

app.post('/signup', async (req, res) => {
  console.log(await db.getUserByEmail(req.body.email))
  if (await db.getUserByEmail(req.body.email) == null) {
    let userId = genId()
    let salt = 10
    bcrypt.hash(req.body.password, salt, async (err, hash) => {
      if (hash) {
        await db.addUser(req.body.email, userId, hash)
        console.log(hash)
        res.status(200).json({ message: 'Account creation successful.'})
        return
      } else {
        res.status(500).json({message: 'Could not hash password.'})
        return
      }
    })
  } else {
    res.status(500).json({ message: 'User already in database '})
    return
  }
})

// after local strategy is authenticated,
// passport will add a login method to request object.
// req.login takes in user object we received from
// local strategy and calls passport.serializeUser().
// it saves that user id to session store and also
// saves the user id to req.session.passport and
// adds the user object to req.user
app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (info) { return res.status(500).json(info.message) }
    if (err) { return res.status(500).json(err.message) }
    if (!user) { return res.status(500).json(info) }

    req.login(user, (err) => {
      if (err) {
        return next(err)
      }
      return res.status(200).json({ message:'You were authenticated.'})
    })
  })(req, res, next)
})

app.get('/signout' , (req, res) => {
  console.log('User signed out')
  req.logOut()
  res.redirect('/')
})

app.get('/item/:id', async (req, res) => {
  let unicode = req.params.id.toLowerCase()
  let emoji = await db.getEmojiByUnicode(unicode, false)
  res.status(200).json(emoji)
})

app.get('/forsale', async (req, res) =>  {
  if (req.user) {
    res.status(200).json(await db.getForSale())
    return
  } else {
    res.status(500).json({ error: 'You must be signed in. '})
  }
})

app.post('/forsale/updateprice', async (req, res) => {
  let updatedItem = await db.updateMarketItem(req.body.id, req.body.price)
  res.status(200).json(updatedItem)
})

app.listen(8080, () => {
  console.log('Listening on localhost:8080')
})


// Helper functions
function genId () {
  return (Date.now().toString(36) + Math.random().toString(36).substr(2, 5)).toUpperCase()
}

async function genCreds (password) {
  let userId = genId()
  let salt = 10
  bcrypt.hash(password, salt, (err, hash) => {
    if (hash) {
      return {
        id: userId,
        pw: hash
      }
    } else {
      console.log('error')
      return { error: 'Could not hash with bcrypt'}
    }
  })
}
