let test = require('ava')
let op = require('../../server/database.js')
let { purchase } = require('../../server/purchase.js')
let { AccessError, UpdateError } = require('../files/error.js')

// instantiate test data
let testUser = require('./test-files/testUser.json')
let testPetNew = require('./test-files/testPetNew.json')
let testPetPrevOwner = require('./test-files/testPetPrevOwner.json')
let testSeller = require('./test-files/testSeller.json')
let testItem = require('./test-files/testItem.json')


// set up database or overwrite old data
async function setUpDatabase (db) {
  await db.batch()
    .put(`user/${testUser.id}`, testUser)
    .put(`user/email/${testUser.email}`, testUser.id)
    .put(`user/username/${testUser.username}`, testUser.id)
    .put(`user/${testSeller.id}`, testSeller)
    .put(`user/email/${testSeller.email}`, testSeller.id)
    .put(`user/username/${testSeller.username}`, testSeller.id)
    .put(`emoji/${testItem.unicode}`, { unicode: testItem.unicode, path: testItem.path })
    .put(`emoji/forsale/${testPetNew.unicode}`, testPetNew)
    .put(`emoji/forsale/${testPetPrevOwner.name}`, testPetPrevOwner)
    .put(`emoji/forsale/${testItem.unicode}`, testItem)
    .write()
}

test.beforeEach (async t => {
  let level = require('level-mem')
  let newDB = level('', { valueEncoding: 'json'})
  await setUpDatabase(newDB)
  t.context = {
    db: newDB
  }
})

test('getUserById gets user by id', async t => {
  let user = await op.getUserById(t.context.db, testUser.id)
  t.deepEqual(testUser, user)
})

test('getUserByEmail gets user by email', async t => {
  let user = await op.getUserByEmail(t.context.db, testUser.email)
  t.deepEqual(testUser, user)
})

test('getUserByUsername gets user by username', async t => {
  let user = await op.getUserByUsername(t.context.db, testUser.username)
  t.deepEqual(testUser, user)
})

test('addUser adds a user to database', async t => {
  let newUser = {
    id: 'addUserTestABC123',
    email: 'addUserTest@test.com',
    username: 'addUserTest',
    hash: 'abc123secretsecret',
    balance: 100,
    pets: {},
    items: {}
  }
  await op.addUser(t.context.db, newUser.email, newUser.id, newUser.hash, newUser.username)
  let retrieve = await t.context.db.get('user/addUserTestABC123')
  t.deepEqual(retrieve, newUser)
})

test('getItemForSale gets an item for sale', async t => {
  let item = await op.getItemForSale(t.context.db, testItem.unicode)
  t.deepEqual(item, testItem)
})

test('deleteUser deletes user from database', async t => {
  try {
    await op.deleteUser(t.context.db, testUser.id)
    await t.context.db.get(`user/${testUser.id}`)
  } catch (err) {
    t.pass()
  }
})

test('getPetFromUser gets a pet from user by pet name', async t => {
  let userPet = testUser.pets.turdle
  let dbPet = await op.getPetFromUser(t.context.db, testUser.username, testUser.pets.turdle.name)
  t.deepEqual(userPet, dbPet)
})

test('getEmojiByUnicode gets emoji by unicode', async t => {
  let emoji = await op.getEmojiByUnicode(t.context.db, testItem.unicode)
  t.is(emoji.path, testItem.path)
})

test('getForSale returns all items for sale', async t => {
  await op.getForSale(t.context.db).then(forSale => {
    let test1 = forSale.filter(i => i.name === testPetPrevOwner.name)
    let test2 = forSale.filter(i => i.unicode === testItem.unicode)
    let test3 = forSale.filter(i => i.unicode === testPetNew.unicode)
    if (test1.length > 0 && test2.length > 0 && test3.length > 0) {
      t.pass()
    }
  })
})
