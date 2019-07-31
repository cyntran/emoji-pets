let { getUserById } = require('./database.js')

// PARAMS: id --> user id, itemName --> name of item, info --> item info
async function sell (db, id, itemName, item) {
  console.log(`------------removeUserItem-------------`)
  try {
    let userInfo = await getUserById(db, id)
    let admin = await getReserve(db) + 5
    if (!item.isAnimal) {
      userInfo = updateUserQuantity(db, userInfo, item)
      item = await updateMarketQuantity(db,  item)
      await db.put(`emoji/forsale/${item.unicode}`, item)
    } else {
      delete userInfo.pets[itemName]
      await db.put(`emoji/forsale/${itemName}`, item)
    }
    await db.batch()
      .put(`user/${id}`, userInfo)
      .put('admin/reserve', admin)
      .write()
    return userInfo
  } catch (err) {
    throw err
  }
}

async function getReserve (db) {
  try {
    return await db.get(`admin/reserve`)
  } catch (err) {
    await db.put(`admin/reserve`, 5)
    return 5
  }
}

function updateUserQuantity (db, userInfo, item) {
  if (userInfo.items[item.unicode].quantity - 1 <= 0) {
    delete userInfo.items[item.unicode]
  } else {
    --userInfo.items[item.unicode].quantity
  }
  return userInfo
}

async function updateMarketQuantity (db, item) {
  try {
    item = await db.get(`emoji/forsale/${item.unicode}`)
    ++item.quantity
  } catch (err) {
    if (!err.notFound) throw err
    item.quantity = 1
  }
  return item
}

module.exports = {
  sell,
  getReserve,
  updateUserQuantity,
  updateMarketQuantity
}
