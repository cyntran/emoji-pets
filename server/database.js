let level = require('level')
let db = level('emoji')
let fs = require('fs')
let path = require('path')

let imagePath = path.join(__dirname, '..', 'images/emoji-svg')
let images = []

function addAllEmojis () {
  fs.readdir(imagePath, (err, file) => {
    file.forEach(async (image) => {
      let unicode = image.split('.')
      let filePath = path.join('../images/emoji-svg', image)
      await db.put(`emoji/forsale/${unicode[0]}`, filePath)
    })
  })
  printData ()
}

function printData () {
  let count = 0
  db.createReadStream()
    .on('data', (data) => {
      let JSONPretty = JSON.stringify(data, null, 2)
      console.log(`${JSONPretty}, #: ${count++}`)
    })
}

// Get animals
// TODO: error handling
async function getEmojiByUnicode (unicode, forSale) {
  try {
    let emoObj = {}
    emoObj.unicode = await db.get(`emoji/${unicode}`)
    // emoObj.price =
    return await db.get(`emoji${forSale ? '/forsale' : ''}/${unicode}`)
  } catch (err) {
    throw err
  }
}

async function getAllPets () {
  let arr = []
  let emoji = '1f400'
  for (let i = 0; i < 26; i++) {
    // console.log(String.fromCodePoint(`0x${emoji}`))
    arr.push(await getEmojiByUnicode(emoji))
    emoji = parseInt(emoji, 16)
    emoji+=1
    emoji = emoji.toString(16)
  }
  return arr
}

module.exports = {
  getEmojiByUnicode,
  getAllPets
}
