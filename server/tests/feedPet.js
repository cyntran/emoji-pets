let test = require('ava')
let feedPet = require('../../server/feedPet.js')

console.log('Test currently being run: ', test.meta.file);

async function setUpDatabase (cont) {
  try {
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
            }
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
            }
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
  t.is(hungryPets.length, 3)
})
