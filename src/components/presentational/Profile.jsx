import React, { Component } from "react"
import config from "../../../clientConfig.js"


class Profile extends Component {
  constructor () {
    super ()
    this.state = {
      user: null,
      error: {}
    }
  }

  componentDidMount () {
    let { username } = this.props.match.params
    fetch (`${config.apiUrl}/profile/${username}`, { credentials: 'include' })
    .then(res => res.json())
    .then((user) => {
      if (user.message) {
        this.setState({
          error: user.message
        })
        return
      }
      this.setState({
        user: user
      })
    })
  }

  nextPath (path) {
    this.props.history.push(path)
  }


  render () {
    if (!isEmpty(this.state.error)) {
      return (
        <div>
          <h1 id='title'> Emoji <img id='heart-title' src='../images/emoji-svg/2764.svg'/> Pets </h1>
          <button id="home-btn" onClick={() => this.nextPath('/')}>Dashboard</button>
          <h1 id='fourohfour-error'>404</h1>
          <h1 id="profile-name"> Oops! User not found! <br /> Click Dashboard to go home.</h1>
        </div>
      )
    }
    return (
      <div className='profile-container'>
        <h1 id='title'> Emoji <img id='heart-title' src='../images/emoji-svg/2764.svg'/> Pets </h1>
        <button id="home-btn" onClick={() => this.nextPath('/')}>Dashboard</button>
        { this.state.user && showUser(this.state.user) } <br />
        <p className='user-items-tag'>Pets </p> <hr id='hr'/>
        { this.state.user && showPets(this.state.user) }
      </div>
    )
  }
}


function showUser (userInfo) {
  return (
    <div>
      <p id='username-tag'>Profile of: </p><br />
      <h1 id="profile-name">{userInfo.username}</h1>
    </div>
  )
}

function goToPet (username, petname) {
  window.location.replace(`/pet/${username}/${petname}`)
}

function showPets (usrInfo) {
  let petNames = Object.keys(usrInfo.pets)
  return petNames.map((name, i) =>
    <div className='pets-container' key={i} onClick={() => goToPet(usrInfo.username, name)}>
      <img src={usrInfo.pets[name].path} id='pet'/>
      <p id='pet-name'>{name}</p>
      <p id='pet-age'>age: {usrInfo.pets[name].petData.age}</p>
    </div>
  )
}

// checks if object is empty
function isEmpty (obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object
}


export default Profile
