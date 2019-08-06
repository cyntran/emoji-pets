let { isEmpty } = require('./dbScripts.js')
let { getUserById } = require('./database.js')

// PARAMS: food - food unicode, pet - pet object, user - user object
async function feedPet (db, food, pet, user) {
  let foodItem = user.items[food]
  if (foodItem == null) return user

  pet.petData.feeding = pet.petData.feeding || {}

  if (feed.canFeed) {
    let feed = updateFeedTime(pet.petData.feeding)
    console.log('feedTime after', feed)
    user = updatePetStats(foodItem, pet, user)
    try {
      await db.put(`user/${user.id}`, user)
      return user
    } catch (err) {
      console.log(err)
      throw err
    }
  } else {
    return {
      error: `You can't feed your pet right now. `
    }
  }
}

// subtract hunger by 5
// increase health by 5
function updatePetStats (foodItem, pet, user) {
  let score = (!foodItem.isCrafted) ? 2 : 5
  if (pet.petData.health >= 20) {
    pet.petData.hunger = (pet.petData.hunger - 5 < 0) ? 0 : pet.petData.hunger - 5
    pet.petData.health = (pet.petData.health + 5 > 100) ? 100 : pet.petData.health + 5
    pet.petData.happiness = (pet.petData.happiness + score > 100) ? 100 : pet.petData.happiness + score
    if ((foodItem.quantity - 1) <= 0) {
      delete user.items[foodItem.unicode]
    } else {
      foodItem.quantity -= 1
    }
    user.pets[pet.name].petData = pet.petData
  }
  return user
}

function updateFeedTime (feedTime) {
  console.log('feedTime before', feedTime)
  let hours = Date.now() / 1000 / 60 / 60
  if (hours - feedTime.first < 24 && feedTime.number < 3) {
    ++feedTime.number
    feedTime.last = hours
  }
  if (hours - feedTime.first >= 24) {
    // reset again
    feedTime.number = 1
    feedTime.canFeed = true
    feedTime.first = hours
    feedTime.last = hours
  }
  feedTime.giveHunger = false
  feedTime.canFeed = (feedTime.number > 2) ? false : true
  return feedTime
}

async function findHungryPets (db, id) {
  let user = await getUserById(db, id)
  let hungryPets = getHungryPets(user)
  for (let i = 0; i < hungryPets.length; i++) {
    hungryPets[i].petData.hunger = incrementHunger(hungryPets[i].petData.hunger)
    user.pets[hungryPets[i].name] = hungryPets[i]
  }
  try {
    await db.put(`user/${id}`, user)
  } catch (err) {
    throw err
  }
}

function shouldFeedPet (pet) {
  pet.petData.feeding = pet.petData.feeding || {}
  let hours = Date.now() / 1000 / 60 / 60
  if (isEmpty(pet.petData.feeding)) {
    return true
  } else {
    if (pet.petData.feeding.first && hours - pet.petData.feeding.first >= 24) {
      pet.petData.feeding = Object.assign({}, pet.petData.feeding, { giveHunger: true })
      console.log('last feed was 24 hours ago', pet.petData.feeding)
    }
  }
  return pet.petData.feeding.giveHunger
}

function getHungryPets (user) {
  let pets = Object.values(user.pets)
  let hungryPets = []
  for (let i = 0; i < pets.length; i++) {
    if (shouldFeedPet(pets[i])) {
      user.pets[pets[i].name].petData.feeding = {
        first: 0,
        last: 0,
        number: 0,
        canFeed: true,
        giveHunger: false
      }
      hungryPets.push(pets[i])
    }
  }
  return hungryPets
}

function incrementHunger (hunger) {
  return (hunger + 10 > 100) ? 100 : hunger + 10
}


module.exports = {
  feedPet,
  updateFeedTime,
  updatePetStats,
  findHungryPets,
  getHungryPets,
  incrementHunger
}
