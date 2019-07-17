let { isEmpty } = require('./dbScripts.js')

// PARAMS: food - food unicode, pet - pet object, id - userID

function feedPet (food, pet, user) {
  let petName = pet.name
  let feedTime = pet.petData.feeding || {}
  let feed = shouldFeedPet(feedTime)
  let foodItem = user.items[food]
  if (foodItem == null) return
  if (feed.canFeed) updatePetStats(foodItem, pet, user)
}


// subtract hunger by 5
// increase health by 5
function updatePetStats (foodItem, pet, user) {
  let score = (!foodItem.isCrafted) ? 2 : 5
  pet.petData.happiness = getHappinessFromFood(pet.petData, score)
  if ((foodItem.quantity - 1) <= 0) {
    delete user.items[foodItem.unicode]
  } else {
    foodItem.quantity -= 1
  }
  pet.petData.hunger = (pet.petData.hunger - 5 < 0) ? 0 : pet.petData.hunger - 5
  pet.petData.health = (pet.petData.health + 5 > 100) ? 100 : pet.petData.health + 5
  user.pets[pet.name] = pet
}

// PARAMS: pet - pet object, happiness - value to be added to pet object
// IF pet health is below zero, do not update happiness score.
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
    return feedTime
  } else {
    return false
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
}

module.exports = {
  feedPet,
  shouldFeedPet,
  updatePetStats,
  getHappinessFromFood,
  updateFeedData
}
