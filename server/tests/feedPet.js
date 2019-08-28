let test = require('ava')
let feedPet = require('../../server/feedPet.js')
let dbScripts = require('../../server/dbScripts.js')

console.log('Test currently being run: ', test.meta.file);

async function setUpDatabase (cont) {
  try {
    await cont.db.put(`user/${cont.testUser.id}`, cont.testUser)
    await cont.db.put(`user/${cont.testUserHunger.id}`, cont.testUserHunger)
    await cont.db.put(`user/${cont.fakeUser.id}`, cont.fakeUser)
    await cont.db.put(`user/${cont.fakeUser2.id}`, cont.fakeUser2)
  } catch (err) {
    console.log(err)
    throw err
  }
}

test.beforeEach(async t => {
  let level = require('level-mem')
  let hours = Date.now() / 1000 / 60 / 60
  t.context = {
    db: level('', { valueEncoding: 'json' }),
    testUser: require('./test-files/testUser.json'),
    testUserHunger: require('./test-files/testUserHunger.json'),
    testItem: require('./test-files/testItem2.json'),
    testItem2: require('./test-files/testItem.json'),
    fakeUser: {
      id: 'eeee',
      pets: {
        fakePetNotHungry: {
          petData: {
            feeding: {
              first: hours,
              last: 0,
              canFeed: true,
              giveHunger: false
            },
            hunger: 0,
            happiness: 100,
            health: 10,
            prevOwner: 'eeee'
          },
          name: 'fakePetNotHungry'
        }
      }
    },
    fakeUser2: {
      id: 'eeee2',
      pets: {
        fakePetHungry: {
          petData: {
            feeding: {
              first: 0,
              last: 0,
              canFeed: true,
              giveHunger: false
            },
            hunger: 0,
            happiness: 100,
            health: 10,
            prevOwner: 'eeee2'
          },
          name: 'fakePetHungry'
        }
      }
    }
  }
  await setUpDatabase(t.context)
})

test('createFeedTimeObj returns a feed time object', t => {
  let obj = {
    first: 0,
    last: 0,
    number: 0,
    canFeed: true,
    giveHunger: false
  }
  t.deepEqual(feedPet.createFeedTimeObj(), obj)
})

test('decrementHealth decrements a given health by 10 unless health < 10', t => {
  let num = 11
  let num2 = 9
  t.plan(2)
  t.is(1, feedPet.decrementHealth(num))
  t.is(0, feedPet.decrementHealth(num2))
})

test('decrementHappiness decrements a given happiness by 10 unless happiness < 10', t => {
  let num = 11
  let num2 = 9
  t.plan(2)
  t.is(1, feedPet.decrementHappiness(num))
  t.is(0, feedPet.decrementHappiness(num2))
})

test('incrementHunger increments a given hunger by 25 unless hunger > 75', t => {
  let num = 76
  let num2 = 74
  t.plan(2)
  t.is(100, feedPet.incrementHunger(num))
  t.is(99, feedPet.incrementHunger(num2))
})

test('shouldFeedPet returns true or false', t => {
  let shouldFeed = feedPet.shouldFeedPet(t.context.testUserHunger.pets['turdle'])

  let testPetShouldntFeed = t.context.testUserHunger.pets['bunny_wabbit']
  testPetShouldntFeed.petData.feeding.first = Date.now() / 1000 / 60 / 60

  let shouldntFeed = feedPet.shouldFeedPet(testPetShouldntFeed, false)
  t.plan(2)
  t.is(shouldFeed, true)
  t.is(shouldntFeed, false)
})

test('getAllHungryPets returns a list of all hungry pets', async t => {
  let hungryPets = await feedPet.getAllHungryPets(t.context.db)
  let numOfPets = await dbScripts.getNumberOfPets(t.context.db)
  t.plan(2)
  t.is(hungryPets.length, 6)
  t.is(numOfPets, 7)
})

test('updateHungryPets increments hunger and decrements happiness', async t => {
  let turdleBefore = t.context.testUserHunger.pets['turdle'].petData
  let bunnyWabbitBefore = t.context.testUserHunger.pets['bunny_wabbit'].petData
  try {
    await feedPet.updateHungryPets(t.context.db)
    let user = await t.context.db.get(`user/${t.context.testUserHunger.id}`)
    let turdleAfter = user.pets['turdle'].petData
    let bunnyWabbitAfter = user.pets['bunny_wabbit'].petData
    t.plan(4)
    t.is(turdleAfter.hunger, (turdleBefore.hunger + 25))
    t.is(bunnyWabbitAfter.hunger, (bunnyWabbitBefore.hunger + 25))
    t.is(turdleAfter.happiness, (turdleBefore.happiness - 10))
    t.is(bunnyWabbitAfter.happiness, (bunnyWabbitBefore.happiness - 10))
  } catch (err) {
    console.log(err)
    throw err
  }
})

test('updateHungryPets decrements health if pet hunger === 100', async t => {
  try {
    let starvingPet = {
      'starvingPet': {
        petData: {
          feedTime: { first: 0, last: 0, number: 0, canFeed: true, giveHunger: false},
          hunger: 75,
          health: 100,
          happiness: 100,
          prevOwner: 'JTV4B90XPI4QM'
        },
        name: 'starvingPet'
      }
    }
    t.context.testUserHunger.pets = Object.assign(t.context.testUserHunger.pets, starvingPet)
    await t.context.db.put(`user/${t.context.testUserHunger.id}`, t.context.testUserHunger)
    await feedPet.updateHungryPets(t.context.db)
    let user = await t.context.db.get(`user/${t.context.testUserHunger.id}`)
    t.plan(2)
    t.is(user.pets.starvingPet.petData.hunger, 100)
    t.is(user.pets.starvingPet.petData.health, 90)
  } catch (err) {
    console.log(err)
    throw err
  }
})

test('updateHungryPets kills a starving pet if their new health becomes zero', async t => {
  try {
    let dyingPet = {
      'dyingPet': {
        petData: {
          feedTime: { first: 0, last: 0, number: 0, canFeed: true, giveHunger: false},
          hunger: 75,
          health: 10,
          happiness: 20,
          prevOwner: 'JTV4B90XPI4QM'
        },
        name: 'dyingPet'
      }
    }
    t.context.testUserHunger.pets = Object.assign(t.context.testUserHunger.pets, dyingPet)
    await t.context.db.put(`user/${t.context.testUserHunger.id}`, t.context.testUserHunger)
    await feedPet.updateHungryPets(t.context.db)
    let user = await t.context.db.get(`user/${t.context.testUserHunger.id}`)
    if (!user.pets.dyingPet) {
      t.pass()
    } else {
      t.fail()
    }
  } catch (err) {
    console.log(err)
    throw err
  }
})

test('updateFeedTime increments feedTime number if first feed was < 24 hours ago', t => {
  let currentTimeInHrs = Date.now () / 1000 / 60 / 60
  let tenHrsAgo = currentTimeInHrs - 10
  let feedTime = {
    first: tenHrsAgo,
    last: tenHrsAgo,
    number: 1,
    canFeed: true,
    giveHunger: false
  }
  let updated = feedPet.updateFeedTime(Object.assign({}, feedTime))
  t.is(updated.number, feedTime.number + 1)
})

test('updateFeedTime resets feedTime object if first feed was >= 24 hours ago', t => {
  let currentTimeInHrs = Date.now () / 1000 / 60 / 60
  let currentTimeInMinutes = Math.round(Date.now() / 1000 / 60)
  let twentyFourHoursAgo = currentTimeInHrs - 24
  let feedTime = {
    first: twentyFourHoursAgo,
    last: twentyFourHoursAgo,
    number: 3,
    canFeed: false,
    giveHunger: false
  }
  let updated = feedPet.updateFeedTime(Object.assign({}, feedTime))
  let getMinutes = Math.round(updated.first * 60)
  t.is(updated.number, 1)
  t.is(updated.canFeed, true)
  t.is(getMinutes, currentTimeInMinutes)
})

test('updatePetStats subtracts 10 from pet hunger and adds 10 to pet health', async t => {
  let user = await t.context.db.get(`user/${t.context.testUserHunger.id}`)
  let pet = user.pets['turdle']
  let prevPetHunger = pet.petData.hunger
  let prevPetHealth = pet.petData.health
  let food = t.context.testItem
  let update = feedPet.updatePetStats(food, pet, user)
  t.is(update.pets['turdle'].petData.hunger, prevPetHunger - 10)
  t.is(update.pets['turdle'].petData.health, prevPetHealth + 10)
})

test('updatePetStats deletes food from user items if they have consumed all of it', async t => {
  let user = await t.context.db.get(`user/${t.context.testUser.id}`)
  let pet = user.pets['turdle']
  let userItem = Object.assign({}, user.items['1f346'])
  let data = feedPet.updatePetStats(userItem, pet, user)
  if (!user.items['1f346']) {
    t.pass()
  } else {
    t.fail()
  }
})

test('updatePetStats subtracts food quantity of consumed food item', async t => {
  let user = await t.context.db.get(`user/${t.context.testUser.id}`)
  let pet = user.pets['turdle']
  let userItem = user.items['1f34c']
  let quantityBefore = userItem.quantity
  feedPet.updatePetStats(userItem, pet, user)
  t.is(user.items[`1f34c`].quantity, quantityBefore - 1)
})

test('feedPet creates feedTime object if pet does not have one', async t => {
  let pet = {
    "example" : {
      petData: {
        hunger: 20,
        happiness: 100,
        health: 80
      },
      name: "example"
    }
  }
  let user = await t.context.db.get(`user/${t.context.testUser.id}`)
  user.pets['example'] = pet.example
  let food = t.context.testItem2.unicode

  let updatedUser = await feedPet.feedPet(t.context.db, food, pet.example, user)
  if (updatedUser.pets['example'].petData.feeding) {
    t.pass()
  } else {
    t.fail()
  }
})

test('feedPet updates pet stats and feedtime and stores to db', async t => {
  let pet = {
    "example" : {
      petData: {
        hunger: 20,
        happiness: 90,
        health: 80
      },
      name: "example"
    }
  }

  let petHealthB4 = pet.example.petData.health
  let petHappinessB4 = pet.example.petData.happiness
  let petHungerB4 = pet.example.petData.hunger

  let user = await t.context.db.get(`user/${t.context.testUser.id}`)
  user.pets['example'] = pet.example
  let food = t.context.testItem2.unicode

  await feedPet.feedPet(t.context.db, food, pet.example, user)
  let updatedUser = await t.context.db.get(`user/${user.id}`)

  t.plan(3)
  if (updatedUser.pets['example'].petData.feeding) {
    t.is(updatedUser.pets['example'].petData.hunger, petHungerB4 - 10)
    t.is(updatedUser.pets['example'].petData.health, petHealthB4 + 10)
    t.is(updatedUser.pets['example'].petData.happiness, petHappinessB4  + 2)
  } else {
    t.fail()
  }
})
