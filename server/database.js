let level = require('level')
let db = level('emoji', { valueEncoding: 'json' })
let fs = require('fs')
let path = require('path')

let imagePath = path.join(__dirname, '..', 'images/emoji-svg')
let images = []

//TODO: error handling

function deleteAllEmojis () {
  db.createReadStream ()
    .on('data', (entry) => {
      db.del(entry.key)
    })
    .on('end', () => {
      printData()
    })
}

function addAllEmojis () {
  fs.readdir(imagePath, (err, file) => {
    file.forEach(async (image) => {
      let unicode = image.split('.')
      let filePath = path.join('../images/emoji-svg', image)
      let obj = {}
      obj.path = filePath
      if (forSale(unicode)) {
        obj.price = 10
        await db.put(`emoji/forsale/${unicode[0]}`, obj)
      }
      await db.put(`emoji/${unicode[0]}`, obj)
    })
  })
  printData ()
}

function forSale (unicode) {
  let min = parseInt('1f400', 16)
  let max = min + 25
  let emojiId = parseInt(unicode, 16)
  return (min <= emojiId && emojiId <= max)
}

function printData () {
  let count = 0
  db.createReadStream()
    .on('data', (data) => {
      let JSONPretty = JSON.stringify(data, null, 2)
      console.log(`${JSONPretty}, #: ${count++}`)
    })
}

async function getEmojiByUnicode (unicode, forSale) {
  try {
    return await db.get(`emoji${forSale ? '/forsale' : ''}/${unicode}`)
  } catch (err) {
    throw err
  }
}

//TODO: fix this later
async function getForSale () {
  let arr = []
  let emoji = '1f400'
  for (let i = 0; i < 26; i++) {
    arr.push(await getEmojiByUnicode(emoji, true))
    emoji = parseInt(emoji, 16)
    emoji += 1
    emoji = emoji.toString(16)
  }
  return arr
}

async function updateMarketItem (unicode, price) {
  try {
    let item = await db.get(`emoji/forsale/${unicode}`)
    item.price = price
    await db.put(`emoji/forsale/${unicode}`, item)
  } catch (err) {
    throw err
  }
}


module.exports = {
  getEmojiByUnicode,
  getForSale
}
