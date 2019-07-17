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
  }
  await setUpDatabase(t.context)
})

test('shouldFeedPet instantiates feedTime object with data if empty', t => {
  let keys = ['first', 'last', 'number', 'canFeed', 'giveHunger']
  let feedTime = feedPet.shouldFeedPet({})
  let feedTimeKeys = Object.keys(feedTime).sort()
  if (JSON.stringify(feedTimeKeys)  === JSON.stringify(keys.sort())) {
    t.pass()
  } else {
    t.fail(`feedTimeKeys: ${feedTimeKeys}\n keys: ${keys}`)
  }
})

// pets can be fed up to three a day.
test('shouldFeedPet returns false if FIRST feed of the day was less than 24 hours ago', t => {
  let current = Date.now() / 1000 / 60 / 60
  let shouldFeed = feedPet.shouldFeedPet({ first: current, last: 0, number: 1, canFeed: false, giveHunger: false })
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
