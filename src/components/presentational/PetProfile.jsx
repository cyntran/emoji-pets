import React, { Component } from "react"
import ProgressBar from "./ProgressBar.jsx"
import config from ".../clientConfig.js"


class PetProfile extends Component {
  constructor (props) {
    super (props)
    this.state = {
      username: this.props.match.params.username,
      petname: this.props.match.params.petname,
      pet: false
    }
  }

  componentDidMount () {
    const { username, petname } = this.state
    fetch(`${config.apiUrl}/pet/${username}/${petname}`)
    .then(res => res.json())
    .then(pet => { this.setState({ pet: pet }) })
  }

  nextPath(path) {
    this.props.history.push(path)
  }

  render () {
    const { pet } = this.state
    const { path } = pet
    if (pet) {
    return (
        <div className='pet-profile-container'>
          <button id='pet-home-btn' onClick={() => this.nextPath('/')}>Back</button>
          <h1 id='title'> Emoji <img id='heart-title' src='/images/emoji-svg/2764.svg'/> Pets </h1>
          <img id='pet-img-profile' src={'/' + path} />
          <h1 id='pet-name-profile'><u>{pet.name}</u></h1>
          <div className='pet-profile-details'>
            <span className='pet-profile-span'>
              <span id='age-generation-profile'>age:</span>
              <span className='pet-data'>{pet.petData.age}</span>
            </span><br />
            <span className='pet-profile-span'>
              <span id='age-generation-profile'>generation:</span>
              <span className='pet-data'>{pet.petData.generation}</span>
            </span><br />
            {getTraits(pet)}
            <span className='pet-profile-span' id='pet-profile-bio-tag' >bio: </span> <br />
            <span className='pet-data' id='pet-profile-bio'>{pet.petData.bio}</span>
          </div>
        </div>
      )
    }
    if (!pet) {
      return (
        <div>
          <button id='pet-home-btn' onClick={() => this.nextPath('/')}>Back</button>
          <h1 id='title'> Emoji <img id='heart-title' src='/images/emoji-svg/2764.svg'/> Pets </h1>
          <h1 id='aww-poop'>Aww</h1><img id='poop-emoji' src='/images/emoji-svg/1f4a9.svg' /> <br />
          <p id='bad-link-msg'>Bad link! Please go back and try again!</p>
        </div>
      )
    }
  }
}

// TODO: include hunger
function getTraits (pet) {
  let petInfo = pet.petData
  let progressObj = (({hunger, health, intelligence, charisma, attractiveness}) =>
    ({hunger, health, intelligence, charisma, attractiveness}))(petInfo)
  return Object.keys(progressObj).map((key, i) => {
    return (
      <div className='pet-info-div' key={key + '-trait'}>
        <span className='pet-profile-span'>{key}: </span>
          <ProgressBar now={progressObj[key]}/>
          <span className='pet-data'> {progressObj[key]}</span><br />
      </div>
    )
  })
}

export default PetProfile
