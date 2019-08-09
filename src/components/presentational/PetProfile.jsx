import React, { Component } from "react"
import ProgressBar from "./ProgressBar.jsx"
import config from "../../../clientConfig.js"
let backBtn = '/images/emoji-svg/2b05.svg'
let homeBtn = '/images/emoji-svg/1f3e0.svg'
let sellBtn = '/images/emoji-svg/1f4b5.svg'

class PetProfile extends Component {
  constructor (props) {
    super (props)
    this.state = {
      username: this.props.match.params.username,
      petname: this.props.match.params.petname,
      pet: false,
      me: false,
      them: false
    }
  }

  componentDidMount () {
    const { username, petname } = this.state
    fetch(`${config.apiUrl}/pet/${username}/${petname}`, { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      console.log(data)
      this.setState({ pet: data.pet, them: data.them, me: data.me })
    })
  }

  render () {
    const { pet } = this.state
    const { path } = pet
    if (pet) {
    return (
        <div className='pet-profile-container'>
          <button id='pet-home-btn' onClick={() => this.props.history.goBack()}>
            <img id='back-btn-img' src={backBtn}/>
          </button>
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
            <span className='pet-data' id='pet-profile-bio'>{pet.bio}</span><br />
            <button id='go-dash-btn' onClick={() => window.location = '/'}>
              <span id='go-dash-txt'><img id='home-img' src={homeBtn}/>
                <span id='go-dash-txt-txt'>Home</span>
              </span>
            </button>
            { this.state.me === this.state.them &&
              <button id='prof-sell-btn' onClick={() => window.location = '/'}>
                <span id='prof-sell-txt'>
                  <img id='prof-sell-img' src={sellBtn}/>
                  <span id='prof-sell-txt-txt'>Sell</span>
                </span>
            </button> }
          </div>
        </div>
      )
    }
    if (!pet) {
      return (
        <div>
          <button id='pet-home-btn' onClick={() => this.props.history.goBack()}>Back</button>
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
  let progressObj = (({happiness, hunger, health, intelligence, charisma, attractiveness}) =>
    ({happiness, hunger, health, intelligence, charisma, attractiveness}))(petInfo)
  return Object.keys(progressObj).map((key, i) => {
    return (
      <div className='pet-info-div' key={key + '-trait'}>
        <span className='pet-profile-span'>{key}: </span>
          <ProgressBar now={progressObj[key]}/>
          <span className='pet-data'> {progressObj[key]}/100 </span><br />
      </div>
    )
  })
}

export default PetProfile
