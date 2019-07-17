let { isEmpty } = require('./dbScripts.js')

// PARAMS: food - food unicode, pet - pet object, id - userID

function feedPet (food, pet, user) {
  let petName = pet.name
  let feedTime = pet.petData.feeding || {}
  console.log(`--------------------- BEGIN ------------------------`)
  console.log('before petData:', JSON.stringify(user.pets[petName], null, 2))
  let feed = shouldFeedPet(feedTime)
  let foodItem = user.items[food]
  if (foodItem == null) return
  console.log(`return value of shouldFeedPet: ${JSON.stringify(feed, null, 2)}`)
  if (feed.canFeed) updatePetStats(foodItem, pet, user)
}

function updatePetStats (foodItem, pet, user) {
  let score = (!foodItem.isCrafted) ? 2 : 5
  pet.petData.happiness = getHappinessFromFood(pet.petData, score)
  if ((foodItem.quantity - 1) <= 0) {
    delete user.items[food]
  } else {
    foodItem.quantity -= 1
  }
  console.log(`updated food item quantity or deleted: ${!user.items[foodItem.unicode] ? 'deleted' : JSON.stringify(user.items[foodItem.unicode], null, 2)}`)
  pet.petData.hunger = (pet.petData.hunger - 5 < 0) ? 0 : pet.petData.hunger - 5
  pet.petData.health = (pet.petData.health + 5 > 100) ? 100 : pet.petData.health + 5
  user.pets[pet.name] = pet
  console.log('updated petData:', JSON.stringify(user.pets[pet.name], null, 2))
}

// PARAMS: pet - pet object, happiness - value to be added to pet object
function getHappinessFromFood (petData, happiness) {
  if (petData.health < 100) {
    return petData.happiness
  } else {
    let totalHappiness = petData.happiness + happiness
    return ( totalHappiness > 100) ? 100 : totalHappiness
  }
}

function shouldFeedPet (feedTime) {
  let hours = Date.now() / 1000 / 60 / 60
  console.log(`hours since epoch: ${hours}`)
  if (isEmpty(feedTime)) {
    feedTime = {
      first: 0,
      last: 0,
      number: 0,
      canFeed: true,
      giveHunger: true
    }
  }
  if (hours - feedTime.first >= 24) {
    updateFeedData(hours, feedTime)
    // incrementFeedCount(hours, feedTime)
    return feedTime
  } else {
    return false
  }
}

function incrementFeedCount (hours, feedTime) {
  if (feedTime.number < 3) {
    console.log(`--- INCREMENT COUNT IS TRUE ---`)
    feedTime.number++
    feedTime.last = hours
    feedTime.canFeed = (feedTime.number > 2) ? false : true
  }
}

function updateFeedData (hours, feedTime) {
  // if the last time of the day you fed your pet
  // was within 24 hours of the first time you fed your pet
  // then just increment the number.
  if (feedTime.number < 3 && feedTime.last - feedTime.first < 24) {
    feedTime.number++
    feedTime.last = hours
    feedTime.giveHunger = false
  } else {
    // you last fed your pet over 24 hours from the first time.
    // reset the feedTime number to zero to represent a new feeding day.
    // reset the first time fed to now.
    if (feedTime.last - feedTime.first >= 24) {
      console.log('--- LAST FEED WAS OVER 24 HOURS AGO ---')
      feedTime.number = 0
      feedTime.first = hours
      feedTime.last = hours
      feedTime.giveHunger = true
    }
  }
  feedTime.canFeed = (feedTime.number > 2) ? false : true
  // if (hours - feedTime.last >= 24) {
  //   feedTime.giveHunger = true
  //   feedTime.first = hours
  //   feedTime.number = 0
  // } else {
  //   feedTime.giveHunger = false
  // }
}

module.exports = {
  shouldFeedPet,
  updatePetStats,
  getHappinessFromFood,
  incrementFeedCount,
  updateFeedData
}
