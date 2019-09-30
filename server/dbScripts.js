let fs = require('fs')
let path = require('path')
let { foodArr } = require('./files/saleItems.js')
let gift = require('./files/gifts.json')
// let level = require('level')
// let db = level('emoji', { valueEncoding: 'json' })

// This file serves to hold scripts updating the database
// outside of user activity (e.g, making restorations from bug fixes)
// and a few helper functions.

// deleteFeedUpdateTime()
// addPrevOwner ()
// addPropertyToPet ()
// fixBioPlacement()
// printReserve()
// printHungryPets()
// printFeedTime()

// nukeDatabase()
//   .then(() => printUsers())
//addGiftToPets()
// addAllEmojisToDB()
// giveMoneyToEveryPlayer()

const CHARITY = 500

function giveMoneyToEveryPlayer () {
  let key = 'user/'
  db.createReadStream({
    gte: key,
    lte: 'user/username/' && 'user/email/'
  })
  .on('data', async (entry) => {
    entry.value.balance += CHARITY
    await db.put(`user/${entry.value.id}`, entry.value)
    console.log(`new balance: ${entry.value.balance}`)
  })
}

function printHungryPets () {
  let key = 'user/'
  db.createReadStream({
    gte: key,
    lte: String.fromCharCode(key.charCodeAt(0) + 1)
  })
  .on('data', (entry) => {
    let pets = entry.value.pets
    console.log(JSON.stringify(pets, null, 2))
  })
}

async function deleteReserves () {
  await db.del(`admin/reserve`)
}

async function printFeedTime () {
  try {
    console.log(await db.get('pethungerhour/'))
  } catch (err) {
    throw err
  }
}

async function printReserve () {
  try {
    let amountInRes = await db.get(`admin/reserve`)
    console.log('Total Amount In Reserves: ', JSON.stringify(amountInRes))
  } catch (err) {
    console.log('No reserve stored')
  }
}

async function nukeDatabase () {
  await addAllEmojis ()
  await addFoods ()
  deleteUsers ()
  deleteTestUsers()
  deleteFeedUpdateTime()
}

function deleteFeedUpdateTime () {
  try {
    db.del('pethungerhour/')
    .then(console.log('deleted'))
  } catch (err) {
    console.log(err)
    throw err
  }
}

function addGiftToPets () {
  let key = 'user/'
  db.createReadStream ({
    gte: key,
    lte: String.fromCharCode(key.charCodeAt(0) + 1)
  })
  .on('data', async (entry) => {
    if (entry.value.pets) {
      let pets = Object.values(entry.value.pets)
      for (let i = 0; i < pets.length; i++) {
        let unicode = pets[i].unicode
        // console.log(`PET NAME: ${pets[i].name} GIFT: ${gift[unicode]}`)
        Object.assign(pets[i], { gifts: gift[unicode] })
        entry.value.pets[pets[i].name] = pets[i]
        // console.log(`new user values: ${JSON.stringify(entry.value, null, 2)}`)
        await db.put(`user/${entry.value.id}`, entry.value)
      }
    }
  })
  .on('end', () => {
    db.createReadStream ({
      gte: key,
      lte: String.fromCharCode(key.charCodeAt(0) + 1)
    })
    .on('data', (entry) => console.log(entry.value.pets))
  })
}

function fixBioPlacement () {
  let key = 'user/'
  return new Promise((res, rej) => {
    db.createReadStream({
    gte: key,
    lte: 'user/username/' && 'user/email/'
    })
    .on('data', async (entry) => {
      let user = entry.value
      if (!isEmpty(user.pets)) {
        let pets = Object.values(entry.value.pets)
        for (let i = 0; i < pets.length; i++) {
          if (!pets[i].bio) {
            user.pets[pets[i].name].bio = pets[i].petData.bio
            console.log(user.pets[pets[i].name])
          }
        }
        await db.put(`user/${user.id}`, user)
      }
    })
    .on('end', () => res('finished'))
  })
}

function isEmpty (obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object
}

function addPropertyToPet (propertyName, propertyValue) {
  let key = 'user/'
  return new Promise((res, rej) => {
    db.createReadStream({
    gte: key,
    lte: 'user/username/' && 'user/email/'
    })
    .on('data', async (entry) => {
      let user = entry.value
      if (!isEmpty(user.pets)) {
        let pets = Object.values(entry.value.pets)
        for (let i = 0; i < pets.length; i++) {
          if (!Object.getOwnPropertyNames(pets).includes(propertyName)) {
            user.pets[pets[i].name].petData[propertyName] = propertyValue
            console.log(user.pets[pets[i].name].petData)
          }
        }
        await db.put(`user/${user.id}`, user)
      }
    })
    .on('end', () => res('finished'))
  })
}

function addPrevOwner () {
  let users = []
  let key = 'user/'
  return new Promise((res, rej) => {
    db.createReadStream({
      gte: key,
      lte: 'user/username/' && 'user/email/'
    })
    .on('data', async (data) => {
      let userObj = data.value
      if (!isEmpty(userObj.pets)) {
        let petVals = Object.values(userObj.pets)
        for (let i = 0; i < petVals.length; i++) {
          userObj.pets[petVals[i].name].petData.prevOwner = userObj.id
          console.log(userObj.pets[petVals[i].name])
        }
      }
      await db.put(`user/${userObj.id}`, userObj)
    })
    .on('end', () => {
      res(users)
    })
  })
}

function deleteTestUsers () {
  let key = 'user/username/'
  let id = []
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
    for (let i = 0; i < id.length; i++) {
      await db.del(`user/${id[i]}`)
    }
    deleteEmails()
  })
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
  let key = 'user/'
  let users = []
  db.createReadStream({
    gte: key,
    lte: String.fromCharCode(key.charCodeAt(0) + 1)
  })
  .on('data', async (data) => {
    let id = data.value.id
    let email = data.value.email
    let username = data.value.username
    if (!data.key.includes(`user/email`)
      && !data.key.includes('user/username')
      && !username.includes('judd')
      && !username.includes('kep')
      && !username.includes('mappum')) {
      await db.del(`user/${id}`)
      await db.del(`user/email/${email}`)
      await db.del(`user/username/${username}`)
      users.push(username)
    }
  })
  .on('end', () => {
    console.log(`deleted the following usernames: ${users}`)
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

//TODO: Categorize all other emojis in the game.
function addAllEmojisToDB () {
  let imagePath = path.join(__dirname, '..', 'images/emoji-svg')
  fs.readdir(imagePath, (err, file) => {
    file.forEach(async (image) => {
      let unicode = image.split('.')
      let filePath = path.join('../images/emoji-svg', image)
      let obj = {}
      if (isPetUnicode(unicode[0])) {
        obj.price = 10
        obj.path = filePath
        obj.unicode = unicode[0]
        obj.isAnimal = true
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
      } else {
        obj.path = filePath
        obj.unicode = unicode[0]
        obj.price = 10
        obj.isAnimal = false
        obj.quantity = 1
        obj.category = 'Food'
        if (foodArr.find(x => x[unicode[0]] != null)) {
          let product = foodArr.find(x => x[unicode[0]])[unicode[0]]
          obj.product = product
        }
        obj.isCrafted = false
        obj.seller = null
      }
      await db.put(`emoji/${unicode[0]}`, obj)
    })
  })
}

function addAnimalEmojis () {
  let imagePath = path.join(__dirname, '..', 'images/emoji-svg')
  fs.readdir(imagePath, (err, file) => {
    file.forEach(async (image) => {
      let unicode = image.split('.')
      let filePath = path.join('../images/emoji-svg', image)
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

function getNumberOfPets (myDb) {
  let count = 0
  return new Promise((res, rej) => {
    myDb.createReadStream({
      gte: 'user/',
      lte: String.fromCharCode('user/'.charCodeAt(0) + 1)
    })
    .on('data', (entry) => {
      let pets = Object.keys(entry.value.pets)
      count += pets.length
    })
    .on('end', () => {
      res(count)
    })
  })
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
  .on('end', () => console.log('deleted all emojis'))
}

// Gets a random integer between 10 and 100
function getRandomInt() {
  return Math.round(Math.random() * (95 - 10) + 10);
}

module.exports = {
  getRandomInt,
  isPetUnicode,
  isEmpty,
  getNumberOfPets
}
