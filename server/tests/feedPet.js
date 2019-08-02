let test = require('ava')
let feedPet = require('../../server/feedPet.js')

console.log('Test currently being run: ', test.meta.file);

async function setUpDatabase (cont) {
  await cont.db.put(`user/${cont.testUser.id}`, cont.testUser)
}

test.beforeEach(async t => {
  let level = require('level-mem')
  t.context = {
    db: level('', { valueEncoding: 'json' }),
    testUser: require('./test-files/testUser.json'),
    testItem: require('./test-files/testItem2.json'),
    testItem2: require('./test-files/testItem.json')
  }
  await setUpDatabase(t.context)
})

test('createFeedObject instantiates feedTime object with data if empty', t => {
  let keys = ['first', 'last', 'number', 'canFeed', 'giveHunger']
  let feedTime = feedPet.createFeedObject({})
  let feedTimeKeys = Object.keys(feedTime).sort()
  if (JSON.stringify(feedTimeKeys)  === JSON.stringify(keys.sort())) {
    t.pass()
  } else {
    t.fail(`feedTimeKeys: ${feedTimeKeys}\n keys: ${keys}`)
  }
})

// pets can be fed up to three a day.
test('createFeedObject returns false if FIRST feed of the day was less than 24 hours ago', t => {
  let current = Date.now() / 1000 / 60 / 60
  let shouldFeed = feedPet.createFeedObject({ first: current, last: 0, number: 1, canFeed: false, giveHunger: false })
  t.is(shouldFeed, false)
})

// first time fed => first time fed of the DAY.
// last time fed => last time fed of the DAY.
test('updateFeedData increments feed number when current number < 3 and last fed was within 24hrs of first fed', t => {
  let hours = Date.now() / 1000 / 60 / 60
  let feedTime = {
    first: hours - 24,
    last: hours - 10,
    number: 1,
    canFeed: true,
    giveHunger: false
  }
  feedPet.updateFeedData(hours, feedTime)
  t.is(feedTime.number, 2)
})

test('updateFeedData sets last to hours when current number < 3 and last fed was within 24hrs of first fed', t => {
  let hours = Date.now() / 1000 / 60 / 60
  let feedTime = {
    first: hours - 24,
    last: hours - 10,
    number: 1,
    canFeed: true,
    giveHunger: false
  }
  feedPet.updateFeedData(hours, feedTime)
  t.is(feedTime.last, hours)
})

test('updateFeedData sets giveHunger to false when current number < 3 and last fed was within 24hrs of first fed', t => {
  let hours = Date.now() / 1000 / 60 / 60
  let feedTime = {
    first: hours - 24,
    last: hours - 10,
    number: 1,
    canFeed: true,
    giveHunger: true
  }
  feedPet.updateFeedData(hours, feedTime)
  t.is(feedTime.giveHunger, false)
})

test('updateFeedData resets when the last fed time was outside the 24 hour period', t => {
  let hours = Date.now() / 1000 / 60 / 60
  let feedTime = {
    first: hours,
    last: hours + 24,
    number: 2,
    canFeed: true,
    giveHunger: false
  }
  feedPet.updateFeedData(hours, feedTime)
  t.deepEqual(feedTime, {
    number: 0,
    first: hours,
    last: hours,
    canFeed: true,
    giveHunger: true
  })
})

test('updateFeedData sets canFeed to false if number >= 2 and feeding remains within 24 hour period', t => {
  let hours = Date.now() / 1000 / 60 / 60
  let feedTime = {
    first: hours,
    last: hours + 10,
    number: 3,
    canFeed: true,
    giveHunger: false
  }
  feedPet.updateFeedData(hours, feedTime)
  t.is(feedTime.canFeed, false)
})

test('updatePetStats updates pet happiness with a ceiling of a 100 score', t => {
  let item = t.context.testUser.items[t.context.testItem2.unicode]
  let updated = feedPet.updatePetStats(item, t.context.testUser.pets['turdle'], t.context.testUser)
  t.is(updated.pets['turdle'].petData.health, 100)
})

test('updatePetStats deletes food item in user inventory if quantity under consumption is 1', t => {
  t.context.testUser.items[t.context.testItem.unicode] = t.context.testItem2
  feedPet.updatePetStats(t.context.testItem2, t.context.testUser.pets['turdle'], t.context.testUser)
  if (!t.context.testUser.items[t.context.testItem2]) {
    t.pass()
  } else {
    t.fail()
  }
})

test('updatePetStats subtracts food quantity if food quantity > 1 under consumption', t => {
  let oldQuan = t.context.testUser.items[t.context.testItem2.unicode].quantity
  feedPet.updatePetStats(t.context.testItem2, t.context.testUser.pets['turdle'], t.context.testUser)
  let newQuan = t.context.testUser.items[t.context.testItem2.unicode].quantity
  t.is(newQuan, 2)
})

test('updatePetStats subtracts hunger level by 5 if hunger > 0 and adds 5 to health if health < 100', t => {
  t.context.testUser.pets['turdle'].petData.hunger = 5   // -5 makes 0
  t.context.testUser.pets['turdle'].petData.health = 95  // + 5 makes 100
  feedPet.updatePetStats(t.context.testItem2, t.context.testUser.pets['turdle'], t.context.testUser)
  t.is(t.context.testUser.pets['turdle'].petData.hunger, 0)
  t.is(t.context.testUser.pets['turdle'].petData.health, 100)
})

test('updatePetStats floor for hunger is 0 and ceiling for health is 100', t => {
  t.context.testUser.pets['turdle'].petData.hunger = 0
  t.context.testUser.pets['turdle'].petData.health = 100
  feedPet.updatePetStats(t.context.testItem2, t.context.testUser.pets['turdle'], t.context.testUser)
  t.is(t.context.testUser.pets['turdle'].petData.hunger, 0)
  t.is(t.context.testUser.pets['turdle'].petData.health, 100)
})

test('feedPet updates pet stats if appropriate feeding time', t => {
  let oldHealth = t.context.testUser.pets['turdle'].petData.health = 90
  let oldHunger = t.context.testUser.pets['turdle'].petData.hunger = 10

  feedPet.feedPet(t.context.testItem2.unicode, t.context.testUser.pets['turdle'], t.context.testUser)

  if (oldHealth != t.context.testUser.pets['turdle'].petData.health &&
      oldHunger.hunger != t.context.testUser.pets['turdle'].petData.hunger) {
        t.pass()
  } else {
    t.fail(`oldHealth: ${oldHealth}, oldHunger: ${oldHunger} \n newPetData: ${JSON.stringify(t.context.testUser.pets['turdle'].petData, null, 2)}`)
  }
})

test('getHungryPets returns list of hungry pets', t => {
  let hungryPets = feedPet.getHungryPets(t.context.testUser.pets)
  if (hungryPets.length === 3) {
    t.pass()
  } else {
    t.fail(hungryPets)
  }
})

test('findHungryPets increments pet hunger and updates db', async t => {
  let oldUser = await t.context.db.get(`user/${t.context.testUser.id}`)
  await feedPet.findHungryPets(t.context.db, t.context.testUser.id)
  let updatedUser = await t.context.db.get(`user/${t.context.testUser.id}`)
  let pets = Object.keys(updatedUser.pets)
  t.plan(3)
  for (let i = 0; i < pets.length; i++) {
    let oldHunger = oldUser.pets[pets[i]].petData.hunger
    let newHunger = updatedUser.pets[pets[i]].petData.hunger
    t.is(newHunger, oldHunger + 10)
  }
})
