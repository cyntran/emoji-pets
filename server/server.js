let express = require('express')
let db = require('./database.js')
let session = require('express-session')
let path = require('path')
let uuid = require('uuid/v4')
let bodyParser = require('body-parser')
let passport = require('passport')
let LocalStrategy = require('passport-local').Strategy
let RedisStore = require('connect-redis')(session)
let bcrypt = require('bcrypt')
let crypto = require('crypto')
let forSale = []


//TODO: error handling

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


passport.serializeUser((user, done) => {
  console.log('UserId is saved to the session file here.')
  done(null, user.id)
})

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

let allowedOrigins = [
  'http://localhost:8081',
  'http://emojipet.com'
]

app.use((req, res, next) => {
  if (allowedOrigins.includes(req.get('origin'))) {
    res.set('access-control-allow-origin', req.get('origin'))
  }
  res.set('access-control-allow-headers', 'content-type')
  res.set('access-control-allow-credentials', true)
  next()
})


//TODO: only return the profile data you need.
app.get('/profile/:username', async (req, res) => {
  if (!req.user) {
    res.status(500).json({ message: 'You must logged in to see this profile. '})
    return
  }
  try {
    let user = await db.getUserByUsername(req.params.username)
    let userInfo = {
      username: user.username,
      pets: user.pets
    }
    res.status(200).json(userInfo)
  } catch (err) {
    console.log(err)
    res.status(404).json({ message: 'User not found.' })
  }
})


app.get('/pet/:username/:petname', async (req, res) => {
  let pet = await db.getPetFromUser(req.params.username, req.params.petname)
  res.status(200).json(pet)
})


app.get('/profile', async (req, res) => {
  if (!req.user) {
    res.status(500).json({ error: 'User not logged in.' })
    return
  }
  let user = await db.getUserById(req.user.id)
  console.log(JSON.stringify(user, null, 3))
  res.status(200).json(user)
})


app.post('/signup', async (req, res) => {
  if (await db.getUserByEmail(req.body.email) == null) {
    let userId = genId()
    let salt = 10
    bcrypt.hash(req.body.password, salt, async (err, hash) => {
      if (hash) {
        let user = await db.addUser(req.body.email, userId, hash, req.body.username)
        req.login(user, (err) => {
          if (err) {
            res.status(500).json({ message: 'Database save error.', loggedIn: false })
            return
          } else {
            res.status(200).json({ loggedIn: true })
            return
          }
        })
      } else {
        res.status(500).json({ message: 'Could not save password.' })
        return
      }
    })
  } else {
    res.status(500).json({ message: 'Email already in use.'})
    return
  }
})

app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (info) { return res.status(500).json(info.message) }
    if (err) { return res.status(500).json(err.message) }
    if (!user) { return res.status(500).json(info) }

    req.login(user, (err) => {
      if (err) {
        return next(err)
      }
      return res.status(200).json({ message:'User authenticated.'})
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

// TODO: update user balance as well...
// Handle errors.
app.post('/item/buy', (req, res) => {
  if (!req.user) {
    res.status(500).json({ unauthorized: 'You are not signed in! '})
  }
  console.log(`-------/item/buy NAME------- ${req.body.name}`)

  db.addUserItem(req.user.id, req.body.name, req.body.info)
  .then((userInfo) => {
    console.log('userinfo', userInfo)
    if (!userInfo) {
      res.status(500).json({ message: 'Not enough funds' })
      return
    }
    res.status(200).json(userInfo)
    return
  })
})

app.post('/item/sell', (req, res) => {
  if (!req.user) {
    res.status(500).json({ unauthorized: 'You are not signed in!' })
  }
  let name = req.body.name
  let info = req.body.info
  let userId = req.user.id
  db.removeUserItem(userId, name, info)
  .then((userInfo) => {
    console.log(userInfo)
    res.status(200).send(userInfo)
    return
  })
  .catch(err => {
    console.log(err)
    res.status(500).json({ message: 'Sorry -- could not sell.' })
    return
  })
})

setInterval(async () => {
  forSale = await db.getForSale()}, 1000)

app.get('/forsale', (req, res) =>  {
  res.status(200).json(forSale)
})

app.get('/forsale/item/:id', async (req, res) => {
  let item = await db.getItemForSale(req.params.id)
  if (item.message) {
    res.status(500).json(item.message)
    return
  }
  res.status(200).json(item)
})

if (process.env.NODE_ENV === 'dev') {
  app.listen(8080, () => {
    console.log('Listening on localhost:8080')
  })
} else {
  app.listen(80, () => {
    console.log('Listening on emojipet.com')
  })
}

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
