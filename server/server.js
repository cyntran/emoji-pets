let express = require('express')
let level = require('level')
let db = level('emoji', { valueEncoding: 'json' })
let dbOp = require('./database.js')
let { purchase } = require('./purchase.js')
let { sell } = require('./sell.js')
let feedPet = require('./feedPet.js')
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
   try {
     let user = await dbOp.getUserByEmail(db, email)
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
   } catch (err) {
     if (!err.notFound) throw err
     return done(null, false, { message: 'Email not registered.' })
   }
  }
))


passport.serializeUser((user, done) => {
  console.log('UserId is saved to the session file here.')
  done(null, user.id)
})

passport.deserializeUser(async (id, done) => {
  console.log('Deserializing user and retrieving user')
  const user = await dbOp.getUserById(db, id)
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
    let user = await dbOp.getUserByUsername(db, req.params.username)
    let userInfo = {
      username: user.username,
      pets: user.pets
    }
    res.status(200).json(userInfo)
  } catch (err) {
    res.status(404).json({ message: 'User not found.' })
  }
})


app.get('/pet/:username/:petname', async (req, res) => {
  try {
    let pet = await dbOp.getPetFromUser(db, req.params.username, req.params.petname)
    // TODO: usernames will have to be unique
    let user = await dbOp.getUserByUsername(db, req.params.username)
    res.status(200).json({ pet: pet, me: req.user.id, them: user.id})
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'Pet not found.' })
  }
})


app.get('/profile', async (req, res) => {
  try {
    let user = await dbOp.getUserById(db, req.user.id)
    res.status(200).json(user)
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})


app.post('/signup', async (req, res) => {
  try {
    await dbOp.getUserByEmail(db, req.body.email)
  } catch (err) {
    if (!err.notFound) {
      res.status(500).json({ message: 'Email already in use.'})
      return
    }
    let userId = genId()
    let salt = 10
    bcrypt.hash(req.body.password, salt, async (err, hash) => {
      if (hash) {
        let user = await dbOp.addUser(db, req.body.email, userId, hash, req.body.username)
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
  try {
    let emoji = await dbOp.getEmojiByUnicode(db, unicode)
    res.status(200).json(emoji)
  } catch (err) {
    res.status(500).json({ message: 'Item not found.' })
  }
})

// TODO: update user balance as well...
// Handle errors.
app.post('/item/buy', (req, res) => {
  if (!req.user) {
    res.status(500).json({ unauthorized: 'You are not signed in! '})
  }
  console.log(`-------/item/buy NAME------- ${req.body.name}`)
  purchase(db, req.user.id, req.body.buyData, req.body.item)
  .then((userInfo) => {
    if (!userInfo) {
      res.status(500).json({ message: 'Not enough funds.' })
      return
    }
    res.status(200).json(userInfo)
    return
  })
  .catch(err => {
    res.status(500).json({ message: 'Uh-oh. Could not purchase pet or item!' })
  })
})

app.post('/item/sell', (req, res) => {
  if (!req.user) {
    res.status(500).json({ unauthorized: 'You are not signed in!' })
  }
  let name = req.body.name
  let info = req.body.info
  let userId = req.user.id
  sell(db, userId, name, info)
  .then((userInfo) => {
    res.status(200).send(userInfo)
    return
  })
  .catch(err => {
    res.status(500).json({ message: 'Uh-oh. Could not sell pet or item!' })
    return
  })
})

setInterval(async () => {
  forSale = await dbOp.getForSale(db) }, 1000)

setInterval(async () => { incrementHunger() }, 300000)

app.get('/forsale', (req, res) =>  {
  res.status(200).json(forSale)
})

app.get('/forsale/item/:id', async (req, res) => {
  try {
    let item = await dbOp.getItemForSale(db, req.params.id)
    res.status(200).json(item)
  } catch (err) {
    res.status(500).json({ message: 'Could not get for sale item.' })
  }
})

// food, pet, user
app.post('/action/feed', async (req, res) => {
  //PARAMS: food - food unicode, pet - pet object, user - user object
  try {
    let user = await feedPet.feedPet(db, req.body.food, req.body.pet, req.user)
    res.status(200).json(user.pets[req.body.pet.name])
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: `You can't feed your pet right now` })
  }
})

// only updates hunger levels once per day
// TODO:
// loop thru all the users without having them sign in,.
async function incrementHunger () {
  console.log(`----------increment hunger is being called-------------`)
  let currentTimeInHrs = (Date.now() / 1000 / 60 / 60)
  console.log('current time in hours', currentTimeInHrs)
  try {
    let hoursPast = await db.get(`pethungerhour/`)
    if (currentTimeInHrs - hoursPast >= 24) {
      if (await feedPet.getAllHungryPets(db).length) {
        await feedPet.updateHungryPets(db)
      }
    }
  } catch (err) {
    if (err.notFound) {
      console.log(`pethungerhour is being added to db`)
      await db.put(`pethungerhour/`, currentTimeInHrs)
      await feedPet.updateHungryPets(db)
      return
    }
    throw err
  }
}

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
