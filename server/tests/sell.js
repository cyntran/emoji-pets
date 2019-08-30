let test = require('ava')
let { sell, getReserve, updateMarketQuantity, updateUserQuantity } = require('../../server/sell.js')

// set up database or overwrite old data
async function setUpDatabase (cont) {
  await cont.db.batch()
    .put(`user/${cont.testUser.id}`, cont.testUser)
    .put(`user/email/${cont.testUser.email}`, cont.testUser.id)
    .put(`user/username/${cont.testUser.username}`, cont.testUser.id)
    .put(`user/${cont.testSeller.id}`, cont.testSeller)
    .put(`user/email/${cont.testSeller.email}`, cont.testSeller.id)
    .put(`user/username/${cont.testSeller.username}`, cont.testSeller.id)
    .put(`emoji/${cont.testItem.unicode}`, { unicode: cont.testItem.unicode, path: cont.testItem.path })
    .put(`emoji/forsale/${cont.testPetNew.unicode}`, cont.testPetNew)
    .put(`emoji/forsale/${cont.testPetPrevOwner.name}`, cont.testPetPrevOwner)
    .put(`emoji/forsale/${cont.testItem.unicode}`, cont.testItem)
    .put(`emoji/forsale/${cont.testItem2.unicode}`, cont.testItem2)
    .write()
}

test.beforeEach(async t => {
  let level = require('level-mem')
  t.context = {
    db: level('', { valueEncoding: 'json'}),
    testUser: require('./test-files/testUser.json'),
    testPetNew: require('./test-files/testPetNew.json'),
    testPetPrevOwner: require('./test-files/testPetPrevOwner.json'),
    testSeller: require('./test-files/testSeller.json'),
    testItem: require('./test-files/testItem.json'),
    testItem2: require('./test-files/testItem2.json')
  }
  await setUpDatabase(t.context)
})

test('getReserve returns reserve value', async t => {
  try {
    let amount = await getReserve(t.context.db)
    let otherAmount = await t.context.db.get(`admin/reserve`)
    t.is(amount, otherAmount)
  } catch (err) {
    t.fail()
  }
})

test('updateMarketQuantity increments item quantity for a non-animal item', async t => {
  let updatedItem = await updateMarketQuantity (t.context.db, t.context.testItem)
  t.is(updatedItem.quantity, 101)
})

test('updateMarketQuantity creates a new item on the market if it does not exist', async t => {
  let fakeItem = {
    "path": "../images/emoji-svg/1f34c.svg",
    "unicode": "testItem",
    "price": 10,
    "isAnimal": false,
    "quantity": 1,
    "category": "Test",
    "product": "Test",
    "isCrafted": false,
    "seller": null
  }
  let updatedItem = await updateMarketQuantity(t.context.db, fakeItem)
  let newItem = await t.context.db.get(`emoji/forsale/${fakeItem.unicode}`)
  t.deepEqual(newItem, fakeItem)
})

test('updateUserQuantity decrements user item quantity for a non-animal item that has quantity > 1', t => {
  let updatedUser = updateUserQuantity (t.context.db, t.context.testUser, t.context.testItem)
  t.is(updatedUser.items[t.context.testItem.unicode].quantity, 2)
})

test('updateUserQuantity deletes user item if it is a non-animal item that has quantity <= 0', t => {
  let eggplant = {
    "path": "../images/emoji-svg/1f346.svg",
    "unicode": "1f346",
    "price": 10,
    "isAnimal": false,
    "quantity": 1,
    "category": "Food",
    "product": "egg plant",
    "isCrafted": false,
    "seller": null
  }
  let updatedUser = updateUserQuantity (t.context.db, t.context.testUser, eggplant)
  if (!updatedUser.items["1f346"]) {
    t.pass()
  } else {
    t.fail()
  }
})

test('sell deletes any pet item because they are unique', async t => {
  let updated = await sell(t.context.db, t.context.testUser.id, 'turdle', t.context.testUser.pets['turdle'])
  if (updated && !updated.pets['turdle']) {
    t.pass()
  } else {
    t.fail()
  }
})

test('sell updates user object when user sells an item', async t => {
  let old = await t.context.db.get(`user/${t.context.testUser.id}`)

  await sell(t.context.db, t.context.testUser.id, null, t.context.testItem)
  let dbUser = await t.context.db.get(`user/${t.context.testUser.id}`)
  let dbUserQuan = dbUser.items[t.context.testItem.unicode].quantity

  let oldQuan = old.items[t.context.testItem.unicode].quantity
  t.is(oldQuan - dbUserQuan, 1)
})

test('sell updates market item object when user sells an item', async t => {
  let old = await t.context.db.get(`emoji/forsale/${t.context.testItem.unicode}`)
  let oldQuan = old.quantity

  await sell(t.context.db, t.context.testUser.id, null, t.context.testItem)
  let updated = await t.context.db.get(`emoji/forsale/${t.context.testItem.unicode}`)
  let updatedQuan = updated.quantity

  t.is(updatedQuan, oldQuan + 1)
})

test('sell creates reserve item object when user sells an item', async t => {
  let old = await getReserve(t.context.db)
  await sell(t.context.db, t.context.testUser.id, null, t.context.testItem)
  let updated = await getReserve(t.context.db)
  t.is(old + 5, updated)
})

test('sell correctly adds to reserve when retreiving reserve value', async t => {
  let old = await getReserve(t.context.db) // 5
  await t.context.db.put('admin/reserve', old) // store it back
  await sell(t.context.db, t.context.testUser.id, null, t.context.testItem) // 10
  let updated = await getReserve(t.context.db) // 10
  t.is(old + 5, updated)
})
