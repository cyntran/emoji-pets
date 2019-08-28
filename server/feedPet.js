let { isEmpty } = require('./dbScripts.js')
let { getUserById } = require('./database.js')

// PARAMS: food - food unicode, pet - pet object, user - user object
async function feedPet (db, food, pet, user) {
  let foodItem = user.items[food]
  
  if (foodItem == null) return user

  pet.petData.feeding = pet.petData.feeding || createFeedTimeObj()

  if (pet.petData.feeding.canFeed) {
    let feed = updateFeedTime(pet.petData.feeding)
    user = updatePetStats(foodItem, pet, user)
    try {
      await db.put(`user/${user.id}`, user)
      return user
    } catch (err) {
      console.log(err)
      throw err
    }
  } else {
    console.log(`you can't feed your pet right now ${JSON.stringify(pet.petData.feeding)}`)
    throw { error: `You can't feed your pet right now.` }
  }
}


function updatePetStats (foodItem, pet, user) {
  let score = (!foodItem.isCrafted) ? 2 : 5
  if (pet.petData.health >= 20) {
    pet.petData.hunger = decrementHunger(pet.petData.hunger)
    pet.petData.health = incrementHealth(pet.petData.health)
    pet.petData.happiness = incrementHappiness(pet.petData.happiness, score)
    if ((foodItem.quantity - 1) <= 0) {
      delete user.items[foodItem.unicode]
    } else {
      foodItem.quantity -= 1
    }
    user.pets[pet.name].petData = pet.petData
  }
  return user
}

const HUNGER_DECR = 10
const HEALTH_INCR = 10

function decrementHunger (hunger) {
  return (hunger < HUNGER_DECR) ? 0 : hunger - HUNGER_DECR
}

function incrementHealth (health) {
  return (HEALTH_INCR + health > 100) ? 100 : health + HEALTH_INCR
}

function incrementHappiness (happiness, score) {
  return (happiness + score > 100) ? 100 : happiness + score
}

function firstFeedWasWithin24Hours (hours, feedTime) {
  return (hours - feedTime.first < 24 && feedTime.number < 3)
}

function firstFeedWas24HoursAgo (hours, feedTime) {
  return (hours - feedTime.first >= 24)
}

function updateFeedTime (feedTime) {
  if (isEmpty(feedTime)) {
    feedTime = createFeedTimeObj()
  }
  feedTime.giveHunger = false
  let hours = Date.now() / 1000 / 60 / 60
  if (firstFeedWasWithin24Hours(hours, feedTime)) {
    ++feedTime.number
    feedTime.last = hours
    feedTime.canFeed = (feedTime.number > 2) ? false : true
  }
  if (firstFeedWas24HoursAgo(hours, feedTime)) {
    feedTime.number = 1
    feedTime.canFeed = true
    feedTime.first = hours
    feedTime.last = hours
  }
  return feedTime
}


async function updateHungryPets (db) {
  try {
    let hungryPets = await getAllHungryPets(db)
    for (let i = 0; i < hungryPets.length; i++) {
      let user = await db.get(`user/${hungryPets[i].petData.prevOwner}`)
      hungryPets[i].petData.hunger = incrementHunger(hungryPets[i].petData.hunger)
      hungryPets[i].petData.happiness = decrementHappiness(hungryPets[i].petData.happiness)
      if (isStarving(hungryPets[i])) {
        hungryPets[i].petData.health = decrementHealth(hungryPets[i].petData.health)
        if (shouldKillPet(hungryPets[i])) {
          await killPet(db, user, hungryPets[i])
          return
        }
      }
      user.pets[hungryPets[i].name] = hungryPets[i]
      // console.log('updated pet:', hungryPets[i])
      await db.put(`user/${user.id}`, user)
    }
  } catch (err) {
    console.log(err)
    throw err
  }
}

function isStarving (pet) {
  return (pet.petData.hunger === 100) ? true : false
}

function shouldKillPet (pet) {
  return (pet.petData.health === 0) ? true : false
}

async function killPet (db, user, pet) {
  delete user.pets[pet.name]
  user.deadPets = user.deadPets || {}
  user.deadPets = Object.assign(user.deadPets, { name: pet.name, alertUser: true })
  console.log(user.deadPets)
  await db.put(`user/${user.id}`, user)
}

function shouldFeedPet (pet) {
  pet.petData.feeding = pet.petData.feeding || {}
  let hours = Date.now() / 1000 / 60 / 60
  if (isEmpty(pet.petData.feeding)) {
    return true
  } else {
    if (hours - pet.petData.feeding.first >= 24) {
      // console.log('last feed was:', (hours - pet.petData.feeding.first))
      pet.petData.feeding = Object.assign({}, pet.petData.feeding, { giveHunger: true, canFeed: true })
    }
  }
  return pet.petData.feeding.giveHunger
}

function getAllHungryPets (db) {
  let hungryPets = []
  let key = 'user/'
  return new Promise((res, rej) => {
    try {
      db.createReadStream({
        gte: key,
        lte: key + 'email/' || key + 'username/'
      })
      .on('data', (entry) => {
        let pets = Object.values(entry.value.pets)
        for (let i = 0; i < pets.length; i++) {
          if (shouldFeedPet(pets[i])) {
            // console.log('should feed', pets[i])
            entry.value.pets[pets[i].name].petData.feeding = createFeedTimeObj()
            hungryPets.push(pets[i])
          }
        }
      })
      .on('end', () => {
        res(hungryPets)
      })
    } catch (err) {
      throw err
    }
  })
}

const HAPPINESS_DECR = 10
const HUNGER_INCR = 25
const HEALTH_DECR = 10

function decrementHappiness (happiness) {
  return (happiness < HAPPINESS_DECR) ? 0 : happiness - HAPPINESS_DECR
}

function incrementHunger (hunger) {
  return (HUNGER_INCR + hunger > 100) ? 100 : hunger + HUNGER_INCR
}

function decrementHealth (health) {
  return (health < HEALTH_DECR ) ? 0 : health - HEALTH_DECR
}

function createFeedTimeObj () {
  return {
    first: 0,
    last: 0,
    number: 0,
    canFeed: true,
    giveHunger: false
  }
}


module.exports = {
  feedPet,
  updateFeedTime,
  updatePetStats,
  updateHungryPets,
  createFeedTimeObj,
  getAllHungryPets,
  decrementHealth,
  decrementHappiness,
  shouldFeedPet,
  incrementHunger
}
