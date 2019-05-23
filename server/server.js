let express = require('express')
let app = express()
let db = require('./database.js')

let allowedOrigins = [
  'http://localhost:8081'
]

app.use((req, res, next) => {
  if (allowedOrigins.includes(req.get('origin'))) {
    res.set('access-control-allow-origin', req.get('origin'))
  }
  res.set('access-control-allow-headers', 'content-type')
  next()
})


app.get('/item/:id', async (req, res) => {
  let unicode = req.params.id.toLowerCase()
  let emoji = await db.getEmojiByUnicode(unicode)
  res.status(200).json(emoji)
})

app.get('/forsale', async (req, res) =>  {
  res.status(200).json(await db.getAllPets())
})


app.listen(8080)
