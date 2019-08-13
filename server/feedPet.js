let { isEmpty } = require('./dbScripts.js')
let { getUserById } = require('./database.js')

// PARAMS: food - food unicode, pet - pet object, user - user object
async function feedPet (db, food, pet, user) {
  let foodItem = user.items[food]
  if (foodItem == null) return user

  pet.petData.feeding = pet.petData.feeding || createFeedTimeObj()

  if (pet.petData.feeding.canFeed) {
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
    console.log(`you can't feed your pet right now ${JSON.stringify(pet.petData.feeding)}`)
    throw { error: `You can't feed your pet right now.` }
  }
}

// subtract hunger by 5
// increase health by 5
function updatePetStats (foodItem, pet, user) {
  let score = (!foodItem.isCrafted) ? 2 : 5
  if (pet.petData.health >= 20) {
    pet.petData.hunger = (pet.petData.hunger - 10 < 0) ? 0 : pet.petData.hunger - 10
    pet.petData.health = (pet.petData.health + 10 > 100) ? 100 : pet.petData.health + 10
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
  if (isEmpty(feedTime)) {
    feedTime = createFeedTimeObj()
  }
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

function shouldFeedPet (pet) {
  pet.petData.feeding = pet.petData.feeding || {}
  let hours = Date.now() / 1000 / 60 / 60
  if (isEmpty(pet.petData.feeding)) {
    return true
  } else {
    if (hours - pet.petData.feeding.first >= 24) {
      pet.petData.feeding = Object.assign({}, pet.petData.feeding, { giveHunger: true, canFeed: true })
      console.log('last feed was:', (hours - pet.petData.feeding.first))
    }
  }
  return pet.petData.feeding.giveHunger
}

async function updateHungryPets (db) {
  try {
    let hungryPets = await getAllHungryPets(db)
    for (let i = 0; i < hungryPets.length; i++) {
      let user = await db.get(`user/${hungryPets[i].petData.prevOwner}`)
      hungryPets[i].petData.hunger = incrementHunger(hungryPets[i].petData.hunger)
      hungryPets[i].petData.happiness = decrementHappiness(hungryPets[i].petData.happiness)
      if (hungryPets[i].petData.hunger >= 100) {
        hungryPets[i].petData.health = decrementHealth(hungryPets[i].petData.health)
        if (hungryPets[i].petData.health <= 0) {
          delete user.pets[hungryPets[i].name]
          user.deadPets = {
            name: hungryPets[i],
            alertUser: true
          }
          await db.put(`user/${user.id}`, user)
        }
      }
      user.pets[hungryPets[i].name] = hungryPets[i]
      console.log('updated pet:', hungryPets[i])
      await db.put(`user/${user.id}`, user)
    }
  } catch (err) {
    throw err
  }
}

function decrementHappiness (happiness) {
  return (happiness - 10 <= 0) ? 0 : happiness - 10
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

function incrementHunger (hunger) {
  if (hunger + 25 >= 100) {
    return 100
  }
  return hunger + 25
}

function decrementHealth (health) {
  return (health - 10 <= 0) ? 0 : health - 10
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
  getAllHungryPets,
  incrementHunger
}
