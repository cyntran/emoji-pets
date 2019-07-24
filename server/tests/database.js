let test = require('ava')
let op = require('../../server/database.js')
let { purchase } = require('../../server/purchase.js')
let { AccessError, UpdateError } = require('../files/error.js')

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
  let r = Math.random().toString(36).substring(7)
  t.context = {
    db: level(`emoji-test-${r}`, { valueEncoding: 'json'}),
    testUser:
    {
      "username": "test",
      "id": "JXV4B77XPI4NI",
      "email": "test@test.com",
      "hash": "$2b$10$n8Keo.QmjK3X7CJscpv2m.cnYqeD1LATDyU1np7vwmxIPbH0/XuGy",
      "balance": 70,
      "pets": {
          "turdle": {
            "price": 10,
            "path": "../images/emoji-svg/1f422.svg",
            "unicode": "1f422",
            "isAnimal": true,
            "petData": {
              "feeding": {},
              "hunger": 0,
              "generation": 0,
              "happiness": 100,
              "intelligence": 84,
              "charisma": 19,
              "health": 100,
              "attractiveness": 42,
              "age": "baby",
              "prevOwner": "JXV4B77XPI4NI"
            },
            "name": "turdle",
            "bio": "i m green"
          },
          "bunny_wabbit": {
            "price": 10,
            "path": "../images/emoji-svg/1f407.svg",
            "unicode": "1f407",
            "isAnimal": true,
            "petData": {
              "feeding": {},
              "hunger": 0,
              "generation": 0,
              "happiness": 100,
              "health": 100,
              "intelligence": 69,
              "charisma": 88,
              "health": 100,
              "attractiveness": 12,
              "age": "baby",
              "prevOwner": "JXV4B77XPI4NI"
            },
              "name": "bunny_wabbit",
              "bio": "i am a widdle bunny"
          },
          "white-mousey": {
            "price": 10,
            "path": "../images/emoji-svg/1f401.svg",
            "unicode": "1f401",
            "isAnimal": true,
            "petData": {
              "feeding": {},
              "hunger": 0,
              "generation": 0,
              "happiness": 100,
              "intelligence": 36,
              "charisma": 10,
              "health": 100,
              "attractiveness": 56,
              "age": "baby",
              "prevOwner": "JXV4B77XPI4NI"
            },
            "name": "white-mousey",
            "bio": "My pet is the cutest!"
          }
        },
        "items": {
          "1f33d": {
            "path": "../images/emoji-svg/1f33d.svg",
            "unicode": "1f33d",
            "price": 10,
            "isAnimal": false,
            "quantity": 2,
            "category": "Food",
            "product": "corn",
            "isCrafted": false,
            "seller": null
          },
          "1f345": {
            "path": "../images/emoji-svg/1f345.svg",
            "unicode": "1f345",
            "price": 10,
            "isAnimal": false,
            "quantity": 2,
            "category": "Food",
            "product": "tomato",
            "isCrafted": false,
            "seller": null
          },
          "1f346": {
            "path": "../images/emoji-svg/1f346.svg",
            "unicode": "1f346",
            "price": 10,
            "isAnimal": false,
            "quantity": 1,
            "category": "Food",
            "product": "egg plant",
            "isCrafted": false,
            "seller": null
          },
          "1f34c": {
            "path": "../images/emoji-svg/1f34c.svg",
            "unicode": "1f34c",
            "price": 10,
            "isAnimal": false,
            "quantity": 3,
            "category": "Food",
            "product": "banana",
            "isCrafted": false,
            "seller": null
          }
        }
    },
    testPetNew: require('./test-files/testPetNew.json'),
    testPetPrevOwner: require('./test-files/testPetPrevOwner.json'),
    testSeller: require('./test-files/testSeller.json'),
    testItem: require('./test-files/testItem.json'),
    testItem2: require('./test-files/testItem2.json')
  }
  await setUpDatabase(t.context)
})

test('getUserById gets user by id', async t => {
  let user = await op.getUserById(t.context.db, t.context.testUser.id)
  t.deepEqual(t.context.testUser, user)
})

test('getUserByEmail gets user by email', async t => {
  let user = await op.getUserByEmail(t.context.db, t.context.testUser.email)
  t.deepEqual(t.context.testUser, user)
})

test('getUserByUsername gets user by username', async t => {
  let user = await op.getUserByUsername(t.context.db, t.context.testUser.username)
  t.deepEqual(t.context.testUser, user)
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
  let item = await op.getItemForSale(t.context.db, t.context.testItem.unicode)
  t.deepEqual(item, t.context.testItem)
})

test('deleteUser deletes user from database', async t => {
  try {
    await op.deleteUser(t.context.db, t.context.testUser.id)
    await t.context.db.get(`user/${t.context.testUser.id}`)
  } catch (err) {
    t.pass()
  }
})

test('getPetFromUser gets a pet from user by pet name', async t => {
  let userPet = t.context.testUser.pets.turdle
  let dbPet = await op.getPetFromUser(t.context.db, t.context.testUser.username, t.context.testUser.pets.turdle.name)
  t.deepEqual(userPet, dbPet)
})

test('getEmojiByUnicode gets emoji by unicode', async t => {
  let emoji = await op.getEmojiByUnicode(t.context.db, t.context.testItem.unicode)
  t.is(emoji.path, t.context.testItem.path)
})

test('getForSale returns all items for sale', async t => {
  await op.getForSale(t.context.db).then(forSale => {
    let test1 = forSale.filter(i => i.name === t.context.testPetPrevOwner.name)
    let test2 = forSale.filter(i => i.unicode === t.context.testItem.unicode)
    let test3 = forSale.filter(i => i.unicode === t.context.testPetNew.unicode)
    if (test1.length > 0 && test2.length > 0 && test3.length > 0) {
      t.pass()
    }
  })
})

test('updatePetAfterFeed does not update user pet object when health is < 20', async t => {
  t.context.testUser.pets['bunny_wabbit'].petData.happiness = 80 // + 2
  t.context.testUser.pets['bunny_wabbit'].petData.health = 15 // + 5
  t.context.testUser.pets['bunny_wabbit'].petData.hunger = 5 // -5
  await op.updatePetAfterFeed(t.context.db, t.context.testItem.unicode, t.context.testUser.pets['bunny_wabbit'], t.context.testUser)
  let updatedUser = await t.context.db.get(`user/${t.context.testUser.id}`)
  t.is(updatedUser.pets['bunny_wabbit'].petData.happiness, 80)
  t.is(updatedUser.pets['bunny_wabbit'].petData.health, 15)
  t.is(updatedUser.pets['bunny_wabbit'].petData.hunger, 5)
})

test('updatePetAfterFeed updates user pet object when health >= 20 ', async t => {
  t.context.testUser.pets['bunny_wabbit'].petData.health = 20
  t.context.testUser.pets['bunny_wabbit'].petData.happiness = 90
  t.context.testUser.pets['bunny_wabbit'].petData.hunger = 10
  await op.updatePetAfterFeed(t.context.db, t.context.testItem.unicode, t.context.testUser.pets['bunny_wabbit'], t.context.testUser)
  let updatedUser = await t.context.db.get(`user/${t.context.testUser.id}`)
  t.is(updatedUser.pets['bunny_wabbit'].petData.happiness, 92)
  t.is(updatedUser.pets['bunny_wabbit'].petData.hunger, 5)
  t.is(updatedUser.pets['bunny_wabbit'].petData.health, 25)
})
