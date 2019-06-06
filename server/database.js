let level = require('level')
let db = level('emoji', { valueEncoding: 'json' })
let fs = require('fs')
let path = require('path')

let imagePath = path.join(__dirname, '..', 'images/emoji-svg')
let images = []

//TODO: error handling

function deleteAllEmojisAndAccounts () {
  db.createReadStream ()
    .on('data', (entry) => {
      db.del(entry.key)
    })
    .on('end', () => {
      printData()
    })
}

// addAllEmojis()
// deleteAllEmojisAndAccounts()

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

// Gets a random integer between 10 and 100
function getRandomInt() {
  return Math.round(Math.random() * (95 - 10) + 10);
}

function addAllEmojis () {
  fs.readdir(imagePath, (err, file) => {
    file.forEach(async (image) => {
      let unicode = image.split('.')
      let filePath = path.join('../images/emoji-svg', image)
      let obj = {}
      obj.path = filePath
      obj.unicode = unicode[0]
      if (forSale(unicode)) {
        obj.price = 10
        if (isPetUnicode(unicode)) {
          obj.isAnimal = true
          obj.quantity = 100;
          obj.petData = {},
          obj.petData.hunger = 0,
          obj.petData.generation = 0,
          obj.petData.intelligence = getRandomInt(),
          obj.petData.charisma = getRandomInt(),
          obj.petData.health = 100,
          obj.petData.attractiveness = getRandomInt(),
          obj.petData.age = 'baby',
          obj.petData.bio = "I'm the cutest!",
          obj.petData.prevOwner = false
        }
        await db.put(`emoji/forsale/${unicode[0]}`, obj)
      }
      await db.put(`emoji/${unicode[0]}`, obj)
      await db.put(`admin/reserve`, { reserve: 0 })
    })
  })
  printData ()
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

async function getUserById (id) {
  try {
    return await db.get(`user/${id}`)
  } catch (err) {
    if (err.notFound) {
      return null
    }
    throw err
  }
}

// retrieves user id with email
// then retrieves user object with id
async function getUserByEmail (email) {
  try {
    let id = await db.get(`user/email/${email}`)
    return await getUserById (id)
  } catch (err) {
    if (err.notFound) return null
    throw err
  }
}

async function getUserByUsername (username) {
  try {
    let userId = await db.get(`user/username/${username}`)
    return await getUserById (userId)
  } catch (err) {
    throw err
  }
}

async function checkUsernameExists (username) {
  try {
    return await db.get(`user/username/${username}`)
  } catch (err) {
    if (!err.notFound) throw err
    return false
  }
}

async function addUser (email, uId, passwordHash, uName) {
  try {
    let info = {
      id: uId,
      username: uName,
      email: email,
      hash: passwordHash,
      balance: 100,
      pets: {},
      items: {}
    }
    await db.batch()
      .put(`user/email/${email}`, uId)
      .put(`user/username/${uName}`, uId)
      .put(`user/${uId}`, info)
      .write(() => { console.log(`done batching`) })
    return info
  } catch (err) {
    throw err
  }
}

async function getItemForSale (id) {
  try {
    return await db.get(`emoji/forsale/${id}`)
  } catch (err) {
    if (!err.notFound) throw err
    return { message: 'Item does not exist' }
  }
}

//TODO: work on getting more types
async function getType (id) {
  let pet = await isPetUnicode(id) ? 'pets' : 'food'
  if (pet) {
    return 'pets'
  }
  return 'food'
}

//TODO: Items should be unique and not stored with unicode
async function addUserItem (id, name, info) {
  let updatedUserObj = {}
  console.log(`---addUserItem()--- id: ${id},\nname: ${name},\ninfo: ${JSON.stringify(info, null, 2)}`)
  try {
    let userInfo = await getUserById(id)

    userInfo.balance -= info.price

    if (userInfo.balance < 0) {
      return false
    }

    if (info.quantity < 1 && !info.petData.prevOwner) {
      await db.del(`emoji/forsale/${info.unicode}`)
    } else {
      if (info.petData.prevOwner) {
        await db.del(`emoji/forsale/${name}`)
      }

      if (info.quantity) {
        let newQuan = info.quantity - 1
        console.log(`user info new ${userInfo}`)

        info.petData.intelligence = getRandomInt(),
        info.petData.charisma = getRandomInt(),
        info.petData.health = 100,
        info.petData.attractiveness = getRandomInt(),
        info.price = 10;

        db.put(`emoji/forsale/${info.unicode}`, Object.assign({}, info, { name: info.unicode, quantity: newQuan }), async(err) => {
          if (err) {
            throw err
          } else {
            console.log('success, item quantity changed')
            let updatedItem = await db.get(`emoji/forsale/${info.unicode}`)
            console.log('updatedItem', updatedItem)
          }
        })
      }
    }

    userInfo.pets = userInfo.pets || {}

    let updatedPetData  = {
      hunger: info.petData.hunger,
      generation: 0,
      intelligence: info.petData.intelligence,
      charisma: info.petData.charisma,
      health: info.petData.health,
      attractiveness: info.petData.attractiveness,
      age: info.petData.age,
      bio: info.petData.bio,
      prevOwner: true
    }

    let updatedPet = {
      name: name,
      price: 5,
      unicode: info.unicode,
      path: info.path,
      isAnimal: true,
      petData: updatedPetData
    }

    userInfo.pets[name] = updatedPet

    console.log('new userInfo', userInfo)

    updatedUserObj = userInfo

    console.log(`pets object being stored into user: ${userInfo.pets[name]}`)
    db.put(`user/${id}`, userInfo, async (err) => {
      if (err) {
        throw err
      } else {
        console.log('success, item added')
      }
    })
  } catch (err) {
    throw err
  }
  return updatedUserObj
}

// Right not, removing an item is only removing a given pet by name.
// Update this function for items without a type.
async function removeUserItem (id, item, info) {
  try {
    let userInfo = await getUserById(id)
    let type = 'pets'
    delete userInfo[type][item]

    let price = info.price

    console.log('item', item)
    console.log('price', price)

    userInfo.balance = userInfo.balance + 5

    console.log('users new balance', userInfo.balance)

    let admin = await db.get(`admin/reserve`)
    let reserve = admin.reserve + 5

    db.put(`admin/reserve`, { reserve: reserve }, (err) => {
      if (err) {
        console.log(err)
      }
    })

    console.log(await db.get(`admin/reserve`))

    db.put(`user/${id}`, userInfo, async (err) => {
      if (err) {
        throw err
      }
    })

    await db.put(`emoji/forsale/${item}`, info)

    return await db.get(`user/${id}`)
  } catch (err) {
    throw err
  }
}


async function getPetFromUser (user, pet) {
  let owner = await getUserByUsername(user)
  return owner.pets[pet] == null ? false : owner.pets[pet]
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

async function isPetUnicode (id) {
  let arr = await getAllPetsUnicode()
  if (arr.includes(id)) {
    return true
  }
  return false
}

async function getAllPetsUnicode () {
  let emoji = '1f400'
  let arr = []
  for (let i = 0; i < 26; i++) {
    arr.push(emoji)
    emoji = parseInt(emoji, 16)
    emoji += 1
    emoji = emoji.toString(16)
  }
  return arr
}

function getForSale() {
  return new Promise((resolve, reject) => {
    let key = 'emoji/forsale/'
    let arr = []
    db.createReadStream({
      gte: key,
      lte: String.fromCharCode(key.charCodeAt(0) + 1)
    })
    .on('data', (entry) => {
      arr.push(entry.value)
    })
    .on('end', () => {
      resolve(arr)
    })
    .on('error', reject)
  })
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
  getItemForSale,
  getForSale,
  getUserById,
  getUserByEmail,
  getUserByUsername,
  getPetFromUser,
  addUser,
  updateMarketItem,
  addUserItem,
  removeUserItem
}
