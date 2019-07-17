let fs = require('fs')
let path = require('path')
let { foodArr } = require('./files/saleItems.js')
// let level = require('level')
// let db = level('emoji', { valueEncoding: 'json' })

// This file serves to hold scripts updating the database
// outside of user activity (e.g, making restorations from bug fixes)
// and a few helper functions.


// addAllEmojis ()
// addFoods ()

function isEmpty (obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object
}

function findAndRestoreDatabaseUsers () {
  let id = []
  let key = 'user/username/'
  let petsUnicode = []
  let userPetsUnicode = []
  let newPetData = []
  getAllPetsUnicode().then((unicodes) => petsUnicode = unicodes)
  db.createReadStream({
    gte: key,
    lte: String.fromCharCode(key.charCodeAt(0) + 1)
  })
  .on('data', (data) => {
    if (!data.key.includes('kep') && !data.key.includes('mappum')) {
      id.push(data.value)
    }
  })
  .on('end', async () => {
    let userArr = []
    for (let i = 0; i < id.length; i++) {
      let info = await db.get(`user/${id[i]}`)
      userArr.push(info)
      await db.del(`user/${id[i]}`)
    }
    for (let i = 0; i < userArr.length; i++) {
      if (!isEmpty(userArr[i].pets)) {
        for (let pet in userArr[i].pets) {
          userPetsUnicode.push(userArr[i].pets[pet].unicode)
        }
      }
    }
    for (let i = 0; i < userPetsUnicode.length; i++) {
      let forSalePet = await db.get(`emoji/forsale/${userPetsUnicode[i]}`)
      let newQuan = forSalePet.quantity + 1
      delete forSalePet.name
      delete forSalePet.bio
      forSalePet.petData.bio = 'My pet is the cutest!'
      Object.assign(forSalePet, { quantity: newQuan })
      db.put(`emoji/forsale/${userPetsUnicode[i]}`, forSalePet)
    }
  })
}

function deleteEmails () {
  let key = 'user/email/'
  db.createReadStream({
    gte:key,
    lte:'user/username'
  })
  .on('data', async (data) => {
    let split1 = data.key.split('@')[0]
    let username = split1.split('/')[2]
    if (username == null || (!username.includes('mappum') && !username.includes('kep'))) {
      await db.del(data.key)
    }
  })
}

function deleteUsers () {
  let key = 'user/username/'
  let id = []
  db.createReadStream({
    gte: key,
    lte: String.fromCharCode(key.charCodeAt(0) + 1)
  })
  .on('data', async (data) => {
    if (!data.key.includes('kep') && !data.key.includes('mappum')) {
      id.push(data.value)
      await db.del(data.key)
    }
  })
  .on('end', async () => {
    for (let i = 0; i < id.length; i++) {
      let info = await db.get(`user/${id[i]}`)
      await db.del(`user/${id[i]}`)
      await db.del(`user/email/${info.email}`)
    }
    console.log('finished')
  })
}

function deleteForSale () {
  let key = 'emoji/forsale/'
  db.createReadStream({
    gte: key,
    lte: String.fromCharCode(key.charCodeAt(0) + 1)
  })
  .on('data', (entry) => {
    db.del(entry.key)
  })
  .on('end', () => console.log('finished'))
}

function printData () {
  let count = 0
  db.createReadStream()
    .on('data', (data) => {
      let JSONPretty = JSON.stringify(data, null, 2)
      console.log(`${JSONPretty}, #: ${count++}`)
    })
}

function printUsers () {
  let key = 'user/'
  db.createReadStream({
    gte: key,
    lte: String.fromCharCode(key.charCodeAt(0) + 1)
  })
  .on('data', (data) => {
    console.log(data)
  })
}

async function addFoods () {
  let obj = {}
  for (let i = 0; i < foodArr.length; i++) {
    let uni = Object.keys(foodArr[i])[0]
    let val = Object.values(foodArr[i])[0]
    obj.path = `../images/emoji-svg/${uni}.svg`
    obj.unicode = uni
    obj.price = 10
    obj.isAnimal = false
    obj.quantity = 100
    obj.category = 'Food'
    obj.product = val
    obj.isCrafted = false
    obj.seller = null
    await db.put(`emoji/forsale/${uni}`, obj)
  }
}

function addAllEmojis () {
  let imagePath = path.join(__dirname, '..', 'images/emoji-svg')
  fs.readdir(imagePath, (err, file) => {
    file.forEach(async (image) => {
      let unicode = image.split('.')
      let filePath = path.join('../images/emoji-svg', image)
      await db.put(`emoji/${unicode[0]}`, { unicode: unicode[0], path: filePath})
      if (isPetUnicode(unicode[0])) {
        let obj = {}
        obj.price = 10
        obj.path = filePath
        obj.unicode = unicode[0]
        obj.isAnimal = true
        obj.quantity = 100
        obj.petData = {}
        obj.petData.hunger = 0
        obj.petData.generation = 0
        obj.petData.happiness = 100
        obj.petData.intelligence = getRandomInt()
        obj.petData.charisma = getRandomInt()
        obj.petData.health = 100
        obj.petData.attractiveness = getRandomInt()
        obj.petData.age = 'baby'
        obj.petData.prevOwner = false
        await db.put(`emoji/forsale/${unicode[0]}`, obj)
      }
    })
  })
}

async function printForSale () {
  let key = 'emoji/forsale/'
  db.createReadStream({
    gte: key,
    lte: String.fromCharCode(key.charCodeAt(0) + 1)
  })
  .on('data', (entry) => {
    console.log(entry)
  })
}


function getAllPetsUnicode () {
  let emoji = '1f400'
  let arr = []
  for (let i = 0; i < 26; i++) {
    arr.push(emoji)
    emoji = parseInt(emoji, 16)
    emoji += 1
    emoji = emoji.toString(16)
  }

  // second round of emoji pets
  let newEmoji = '1f420'
  let n = 20
  for (let i = 0; i < 20; i++) {
    let num = n+i
    let uni = '1f4' + num.toString()
    arr.push(uni)
  }
  return arr
}

function isPetUnicode (id) {
  let arr = getAllPetsUnicode()
  if (arr.includes(id)) {
    return true
  }
  return false
}

function deleteEmojis () {
  let key = 'emoji/'
  db.createReadStream({
    gte: key,
    lte: String.fromCharCode(key.charCodeAt(0) + 1)
  })
  .on('data', async (entry) => {
    await db.del(entry.key)
  })
  .on('end', () => console.log('done'))
}

// Gets a random integer between 10 and 100
function getRandomInt() {
  return Math.round(Math.random() * (95 - 10) + 10);
}

module.exports = {
  getRandomInt,
  isPetUnicode,
  isEmpty
}
