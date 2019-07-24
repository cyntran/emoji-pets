let test = require('ava')
let purchase = require('../../server/purchase.js')
let { AccessError, UpdateError } = require('../files/error.js')
let { isEmpty } = require('../../server/dbScripts.js')


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

test('deepCopyUser deep copies user object into new object', t => {
  let cloned = purchase.deepCopyUser(t.context.testUser)
  cloned.items['cloneItem'] = {}
  cloned.items['cloneItem'] = 'diffItem'
  if (!t.context.testUser.items.cloneItem) {
    t.pass()
  }
})

test('updateExistingUserItemQuan adds one to item quantity that exists in user inventory', t => {
  let quan = purchase.updateExistingUserItemQuan(t.context.testItem, t.context.testUser)
  if (quan > 1) {
    t.pass()
  } else {
    t.fail(`quan: ${quan}`)
  }
})

test('updateExistingUserItemQuan updates purchased item to one for an item NOT in user inventory', t => {
  let quan = purchase.updateExistingUserItemQuan(t.context.testItem2, t.context.testUser)
  if (quan != 1) {
    t.fail(`quan: ${quan}`)
  } else {
    t.pass()
  }
})

test('setUserItemProperties copies purchased item properties over to user data', t => {
  purchase.setUserItemProperties(t.context.testUser, t.context.testItem, {}, t.context.testItem.quantity)
  t.deepEqual(t.context.testUser.items[t.context.testItem.unicode], t.context.testItem)
})

test('setUserItemProperties copies purchased pet properties over to user data', t => {
  let petNameBio = { name : 'petName', bio: 'testPet' }
  let combined = Object.assign({}, t.context.testPetNew, petNameBio)
  delete combined.quantity
  purchase.setUserItemProperties(t.context.testUser, t.context.testPetNew, petNameBio, 0)
  t.deepEqual(t.context.testUser.pets[petNameBio.name], combined)
})

test('updateUserBalance subtracts item price from user balance', t => {
  let oldBalance = t.context.testUser.balance
  let itemPrice = t.context.testItem.price
  purchase.updateUserBalance(t.context.testUser, itemPrice)
  if (t.context.testUser.balance + itemPrice === oldBalance) {
    t.pass()
  } else {
    t.fail()
  }
})

test('notEnoughFunds returns true if new user balance is less than 0', t => {
  t.context.testUser.balance = -1
  t.is(purchase.notEnoughFunds(t.context.testUser), true)
})

// testItem has a quantity 100.
test('updatePurchaseItemQuantity decrements market item quantity by one if quantity > 1', async t => {
  let oldQuantity = t.context.testItem.quantity
  await purchase.updatePurchaseItemQuantity(t.context.db, t.context.testItem)
  let newQuantity = t.context.testItem.quantity
  if (oldQuantity - 1 === newQuantity) {
    t.pass()
  } else {
    t.fail()
  }
})

// testItem2 has a quantity of 1.
test('updatePurchaseItemQuantity deletes item if item quantity = 1', async t => {
  await purchase.updatePurchaseItemQuantity(t.context.db, t.context.testItem2)
  try {
    await t.context.db.get(`emoji/forsale/${t.context.testItem2.unicode}`)
  } catch (err) {
    t.pass()
  }
})

test('savePurchaseToUser stores item changes to user in database', async t => {
  let tempUser = {
    username: "clone",
    id: "cloneabc123",
    email: "clone@test.com",
    hash: "123abcabc123abc123",
    balance: 100,
    pets: {},
    items: {
      [t.context.testItem.unicode]: Object.assign({}, t.context.testItem)
    }
  }
  try {
    await purchase.savePurchaseToUser(t.context.db, t.context.testItem, null, tempUser)
    let user = await t.context.db.get(`user/${tempUser.id}`)
    t.deepEqual(user, tempUser)
  } catch (err) {
    t.fail()
  }
})

test('savePurchaseToUser stores pet data to user in database and sets prevOwner to user id', async t => {
  let tempUser = {
    username: "clone",
    id: "cloneabc123",
    email: "clone@test.com",
    hash: "123abcabc123abc123",
    balance: 100,
    pets: {
      [t.context.testPetPrevOwner.name]: Object.assign({}, t.context.testPetPrevOwner)
    },
    items: {}
  }
  try {
    await purchase.savePurchaseToUser(t.context.db, t.context.testPetPrevOwner, t.context.testPetPrevOwner.name, tempUser)
    let oldPrevOwner = t.context.testPetPrevOwner.prevOwner
    let user = await t.context.db.get(`user/${tempUser.id}`)
    let newPrevOwner = user.pets[t.context.testPetPrevOwner.name].petData.prevOwner
    if (user && newPrevOwner && (oldPrevOwner !== newPrevOwner)) {
      t.pass()
    } else {
      t.fail(`error, old owner: ${oldPrevOwner}, new owner: ${newPrevOwner}`)
    }
  } catch (err) {
    t.fail(`error: ${err}`)
  }
})

test('paySeller returns if item has no seller or pet has no previous owner', async t => {
  let fakeUser = {
    id: 'fakeuser123',
    username: 'fakeuser',
    email: 'fakeuser@test.com',
    hash: 'fakeuser123abc123',
    balance: 5,
    pets: {},
    items: {}
  }
  t.context.testPetPrevOwner.petData.prevOwner = fakeUser.id
  await t.context.db.put(`user/${fakeUser.id}`, fakeUser)
  await purchase.paySeller(t.context.db, t.context.testItem, fakeUser.id, 5)
  await purchase.paySeller(t.context.db, t.context.testPetNew, fakeUser.id, 5)
  let user = await t.context.db.get(`user/${fakeUser.id}`)
  if (user.balance != 5) {
    t.fail()
  } else {
    t.pass()
  }
})

// TODO: this test will no longer be valid after bonding curve implementation
test('paySeller pays seller 5 coins upon user purchase', async t => {
  let fakeUser = {
    id: 'fakeuser123',
    username: 'fakeuser',
    email: 'fakeuser@test.com',
    hash: 'fakeuser123abc123',
    balance: 5,
    pets: {},
    items: {}
  }
  t.context.testPetPrevOwner.petData.prevOwner = fakeUser.id
  let oldBalance = fakeUser.balance
  let payment = 5
  await t.context.db.put(`user/${fakeUser.id}`, fakeUser)
  await purchase.paySeller(t.context.db, t.context.testPetPrevOwner, fakeUser.id, payment)
  let updated = await t.context.db.get(`user/${fakeUser.id}`)
  if (payment + oldBalance === updated.balance) {
    t.pass()
  } else {
    t.fail(`payment: ${payment}, oldBalance: ${oldBalance}, updatedBalance: ${updated.balance}`)
  }
})

test('saveItemToMarket gets new pet stats for pet on the market', async t => {
  let oldStats = t.context.testPetNew.petData
  await purchase.saveItemToMarket(t.context.db, t.context.testPetNew)
  let newStats = await t.context.db.get(`emoji/forsale/${t.context.testPetNew.unicode}`).petData
  t.notDeepEqual(newStats, oldStats)
})

test('saveItemToMarket does not get new pet stats for pets with previous owners', async t => {
  let oldStats = t.context.testPetPrevOwner.petData
  await purchase.saveItemToMarket(t.context.db, t.context.testPetPrevOwner)
  let sameStats = await t.context.db.get(`emoji/forsale/${t.context.testPetPrevOwner.name}`)
  t.deepEqual(oldStats, sameStats.petData)
})

test('purchase returns updated userInfo for pet without owner', async t => {
  let tUser = await t.context.db.get(`user/${t.context.testUser.id}`)
  let userInfo = await purchase.purchase(t.context.db, t.context.testUser.id, { name: 'purchasePet', bio: 'testing purchase'}, t.context.testPetNew)
  if (!tUser.pets['purchasePet'] && userInfo.pets['purchasePet']) {
    t.pass()
  } else {
    t.fail()
  }
})

test('purchase returns updated userInfo for item', async t => {
  let tUser = await t.context.db.get(`user/${t.context.testUser.id}`)
  let userInfo = await purchase.purchase(t.context.db, t.context.testUser.id, t.context.testItem2, t.context.testItem2)
  if (userInfo.items[t.context.testItem2.unicode]) {
    t.pass()
  } else {
    t.fail()
  }
})
