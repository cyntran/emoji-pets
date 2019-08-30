let { getRandomInt, isPetUnicode, isEmpty } = require('./dbScripts.js')

// db => database
// id => user id
// buyData => { name, bio } for pet, item object for item
// item => item object
async function purchase (db, id, buyData, item) {
  let userInfo = {}
  try {
    userInfo = await db.get(`user/${id}`)
    let updatedUserInfo = deepCopyUser(userInfo)
    let newQuan = updateExistingUserItemQuan(item, updatedUserInfo)
    setUserItemProperties(updatedUserInfo, item, buyData, newQuan)
    updateUserBalance(updatedUserInfo, item.price)
    if (notEnoughFunds(updatedUserInfo)) return false

    await updatePurchaseItemQuantity(db, item)
    let itemName = (buyData && buyData.name) ? buyData.name : item.unicode
    await savePurchaseToUser(db, item,  itemName, updatedUserInfo)
    await paySeller(db, buyData, item, 5)
    await saveItemToMarket(db, item)
    return updatedUserInfo
  } catch (err) {
    throw err
  }
}

function updateUserBalance (userInfo, price) {
   userInfo.balance -= price
}

function setUserItemProperties (updatedUserInfo, item, buyData, newQuan) {
  let type = item.isAnimal ? 'pets' : 'items'
  let nameOrUni = (type === 'pets') ? buyData.name : item.unicode
  if (type === 'pets') {
    updatedUserInfo[type][nameOrUni] =
      {
        "price": item.price,
        "path": item.path,
        "unicode": item.unicode,
        "isAnimal": true,
        "petData": {
          "hunger": (!item.petData.hunger) ? 25 : item.petData.hunger,
          "generation": item.petData.generation,
          "happiness": item.petData.happiness,
          "intelligence": item.petData.intelligence,
          "charisma": item.petData.charisma,
          "health": item.petData.health,
          "attractiveness": item.petData.attractiveness,
          "age": item.petData.age,
          "prevOwner": item.petData.prevOwner
        },
        name: buyData.name,
        bio: buyData.bio
      }
  } else {
    updatedUserInfo[type][nameOrUni] = {
      "path": item.path,
      "unicode": item.unicode,
      "price": item.price,
      "isAnimal": item.isAnimal,
      "quantity": newQuan,
      "category": item.category,
      "product": item.product,
      "isCrafted": item.isCrafted,
      "seller": null
    }
  }
}

function notEnoughFunds (updatedUserInfo) {
  return updatedUserInfo.balance < 0 ? true : false
}

async function updatePurchaseItemQuantity (db, item) {
  // decrement quantity for market item
  let key = (!item.name) ? item.unicode : item.name
  if (item.quantity != null && item.quantity > 1) {
    --item.quantity
    return item
  } else {
    await db.del(`emoji/forsale/${key}`)
  }
}

function deepCopyUser (userInfo) {
  let copyPets = {}
  let copyItems = {}
  let petKeys = Object.keys(userInfo.pets)
  let itemKeys = Object.keys(userInfo.items)
  for (let i in petKeys) {
    copyPets[petKeys[i]] = {}
    copyPets[petKeys[i]] = userInfo.pets[petKeys[i]]
  }
  for (let i in itemKeys) {
    copyItems[itemKeys[i]] = {}
    copyItems[itemKeys[i]] = userInfo.items[itemKeys[i]]
  }
  return {
    id: userInfo.id,
    username: userInfo.username,
    email: userInfo.email,
    hash: userInfo.hash,
    balance: userInfo.balance,
    pets: copyPets,
    items: copyItems
  }
}

function updateExistingUserItemQuan (item, updatedUserInfo) {
  if (!item.isAnimal) {
    let userHasItem = updatedUserInfo.items[item.unicode] != null
    if (userHasItem) {
      return ++updatedUserInfo.items[item.unicode].quantity
    } else {
      return 1
    }
  }
}

async function savePurchaseToUser(db, item, petName, updatedUserInfo) {
  if (item.isAnimal) {
    updatedUserInfo.pets[petName].petData.prevOwner = updatedUserInfo.id
  }
  await db.put(`user/${updatedUserInfo.id}`, updatedUserInfo)
}

async function saveItemToMarket (db, item) {
  let type = item.isAnimal ? 'pets' : 'items'
  if (type === 'items') {
    await db.put(`emoji/forsale/${item.unicode}`, item)
    return
  }
  if (type === 'pets' && !item.petData.prevOwner) {
    item.petData = getNewPetStats(item.petData)
    await db.put(`emoji/forsale/${item.unicode}`, item)
  } else {
    await db.del(`emoji/forsale/${item.name}`)
    return
  }
}


// sellers only earn from selling pets right now
// items can't be sold yet
async function paySeller (db, buyData, item, amount) {
  // if item not a previous pet, return
  if (!buyData.isAnimal || !buyData.petData.prevOwner) return
  try {
    let prevId = item.petData.prevOwner
    let prevOwner = await db.get(`user/${prevId}`)
    let sellerUpdated = Object.assign({}, prevOwner, {
      balance: prevOwner.balance + amount
    })
    await db.put(`user/${prevId}`, sellerUpdated)
  } catch (err) {
    throw err
  }
}

function getNewPetStats (petData) {
  return Object.assign({}, petData, {
    intelligence: getRandomInt(),
    charisma: getRandomInt(),
    attractiveness: getRandomInt()
  })
}

module.exports = {
  purchase,
  deepCopyUser,
  getNewPetStats,
  paySeller,
  saveItemToMarket,
  savePurchaseToUser,
  updatePurchaseItemQuantity,
  updateExistingUserItemQuan,
  notEnoughFunds,
  setUserItemProperties,
  updateUserBalance
}
