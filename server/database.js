let { getRandomInt, isPetUnicode, isEmpty } = require('./dbScripts.js')
let { AccessError, UpdateError } = require('./files/error.js')

async function getUserById (db, id) {
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

//addAllEmojis()
//deleteAllEmojisAndAccounts()

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
>>>>>>> Stashed changes
  try {
    return await db.get(`user/${id}`)
  } catch (err) {
    if (!err.notFound) throw new AccessError()
    throw err
  }
}

async function getUserByEmail (db, email) {
  try {
    let id = await db.get(`user/email/${email}`)
    return await getUserById (db, id)
  } catch (err) {
    if (!err.notFound) throw new AccessError()
    throw err
  }
}

async function getUserByUsername (db, username) {
  try {
    let userId = await db.get(`user/username/${username}`)
    return await getUserById (db, userId)
  } catch (err) {
    throw err
  }
}

async function addUser (db, email, uId, passwordHash, uName) {
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
    console.error(err)
    throw new UpdateError()
  }
}

async function deleteUser (db, id) {
  try {
    let user = await db.get(`user/${id}`)
    await db.del(`user/${id}`)
    await db.del(`user/username/${user.username}`)
    await db.del(`user/email/${user.email}`)
  } catch (err) {
    throw new AccessError()
  }
}

async function getItemForSale (db, id) {
  try {
    return await db.get(`emoji/forsale/${id}`)
  } catch (err) {
    if (!err.notFound) throw new AccessError()
    throw err
  }
}


async function getPetFromUser (db, user, pet) {
  let owner = await getUserByUsername(db, user)
  return owner.pets[pet] == null ? false : owner.pets[pet]
}

async function getEmojiByUnicode (db, unicode) {
  try {
    return await db.get(`emoji/${unicode}`)
  } catch (err) {
    if (err.notFound) throw new AccessError ()
    throw err
  }
}

function forSale (unicode) {
  let min = parseInt('1f400', 16)
  let max = min + 20
  let emojiId = parseInt(unicode, 16)
  return (min <= emojiId && emojiId <= max)
}

function getForSale (db) {
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


module.exports = {
  getEmojiByUnicode,
  getItemForSale,
  getForSale,
  getUserById,
  getUserByEmail,
  getUserByUsername,
  deleteUser,
  getPetFromUser,
  addUser
}
