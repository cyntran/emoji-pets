let { getRandomInt, isPetUnicode, isEmpty } = require('./dbScripts.js')
let { AccessError, UpdateError } = require('./files/error.js')
let { feedPet } = require('./feedPet.js')
let { purchase } = require('./purchase.js')


async function getUserById (db, id) {
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
    console.error(err)
    throw err
  }
}


// move out
function increaseHunger (db, id) {
  getUserById(db, id)
  .then(async (user) => {
    let pets = Object.values(user.pets)
    let updated = {}
    for (let i = 0; i < pets.length; i++) {
      let pet = pets[i]
      let feeding = Object.assign({}, pet.petData.feeding) || {}
      let data = shouldFeedPet(feeding)
      if (data.giveHunger) {
        pet.petData.hunger = (pet.petData.hunger + 10 > 100) ? 100 : pet.petData.hunger + 10
      }
      updated[pet.name] = pet
    }
    user.pets = updated
    console.log(JSON.stringify(user.pets, null, 4))
    await db.put(`user/${id}`, user)
  })
}


async function addUserItem (db, id, buyData, item) {
  return await purchase(db, id, buyData, item)
}

// PARAMS: id --> user id, itemName --> name of item, info --> item info
//move out
async function removeUserItem (db, id, itemName, info) {
  console.log(`------------removeUserItem-------------`)
  console.log('info', info)
  try {
    let userInfo = await getUserById(db, id)
    let type = info.isAnimal ? 'pets' : 'items'
    if (!info.isAnimal) {
      updateUserQuantity(userInfo, info, itemName)
      info = await updateMarketQuantity(db, itemName)
    } else {
      delete info.quantity
      delete userInfo[type][itemName]
    }
  } catch (err) {
    throw err
  }
}

async function updateUserQuantity (userInfo, info, name) {
  let admin = await db.get(`admin/reserve`)
  try {
    await db.batch()
      .put(`user/${id}`, userInfo)
      .put('admin/', { reserve: admin + 5 })
      .put(`emoji/forsale/${itemName}`, info)
      .write(() => console.log(`done batching`))
    return userInfo
  } catch (err) {
    throw err
  }
}
//
// function updateUserQuantity (userInfo, info, name) {
//   (info.quantity - 1 <= 0) ? delete userInfo.items[name] : --userInfo.items[name].quantity
// }

async function updateMarketQuantity (db, itemName) {
  let item = await db.get(`emoji/forsale/${itemName}`)
  ++item.quantity
  return item
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


// food => food unicode
// pet => pet object
// id => user id
async function updatePetAfterFeed (db, food, pet, user) {
  let updated = feedPet(food, pet, user)
  await db.put(`user/${user.id}`, user)
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
  addUser,
  addUserItem,
  removeUserItem,
  updatePetAfterFeed
}
