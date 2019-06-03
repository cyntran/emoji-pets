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
        obj.prevOwner = false
        if (isPetUnicode(unicode)) {
          obj.isAnimal = true
        }
        await db.put(`emoji/forsale/${unicode[0]}`, obj)
      }
      await db.put(`emoji/${unicode[0]}`, obj)
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

async function addUser (email, uId, passwordHash) {
  try {
    let info = {
      id: uId,
      email: email,
      hash: passwordHash,
      balance: 10,
      pets: {},
      items: {}
    }
    await db.put(`user/email/${email}`, uId)
    await db.put(`user/${uId}`, info)
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
    console.log(pet)
    return 'pets'
  }
  return 'food'
}

//TODO: Items should be unique and not stored with unicode
async function addUserItem (id, name, info) {
  console.log(`---addUserItem()--- id: ${id}, name: ${name}, info: ${JSON.stringify(info)}`)
  try {
    let userInfo = await getUserById(id)
    let petBio = info.bio

    console.log('info.prevOwner', info.prevOwner)
    if (!info.prevOwner) {
      await db.del(`emoji/forsale/${info.unicode}`)
    } else {
      await db.del(`emoji/forsale/${name}`)
    }

    userInfo.pets = userInfo.pets || {}

    let updatedPetInfo = {
      name: name,
      unicode: info.unicode,
      path: info.path,
      isAnimal: true,
      age: 'baby',
      bio: info.bio,
      prevOwner: true
    }

    userInfo.pets[name] = updatedPetInfo

    console.log(`pets object being stored into user: ${userInfo.pets[name]}`)
    db.put(`user/${id}`, userInfo, async (err) => {
      if (err) {
        throw err
      } else {
        console.log('success, item added')
        return await db.get(`user/${id}`)
      }
    })
  } catch (err) {
    throw err
  }
}

// Right not, removing an item is only removing a given pet by name.
// Update this function for items without a type.
async function removeUserItem (id, item, info) {
  try {
    let userInfo = await getUserById(id)
    let type = 'pets'
    console.log(`deleting ${JSON.stringify(userInfo[type][item], null, 2)}`)
    delete userInfo[type][item]

    console.log(`new user object after deleting item: ${userInfo}`)

    db.put(`user/${id}`, userInfo, async (err) => {
      if (err) {
        throw err
      }
    })

    await db.put(`emoji/forsale/${item}`, info)
    console.log('success, item removed')

    return await db.get(`user/${id}`)
  } catch (err) {
    throw err
  }
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
  addUser,
  updateMarketItem,
  addUserItem,
  removeUserItem
}
