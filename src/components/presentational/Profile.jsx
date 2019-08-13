import React, { Component } from "react"
import config from "../../../clientConfig.js"
import { getBackground } from '../../getRGBAverage.js'


class Profile extends Component {
  constructor () {
    super ()
    this.state = {
      user: null,
      error: {}
    }
    this.handleScroll = this.handleScroll.bind(this)
  }

  componentDidMount () {
    window.addEventListener('scroll', this.handleScroll)
    let scrollPs = localStorage.getItem('scrollY')
    if (scrollPs) {
      setTimeout(() => window.scrollTo(0, scrollPs), 200)
    }
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
      let arr = []
      if (user.items && user.pets) {
        arr = Object.values(user.items).concat(Object.values(user.pets))
      } else {
        arr = (!user.items && !user.pets) ? [] : ((!user.items) ? Object.values(user.pets) : Object.values(user.items))
      }
      for (let i = 0; i < arr.length; i++) {
        getBackground(arr[i].path).then((rgb) => {
          document.querySelector(`#pet${i}`).style.background ='rgb('+rgb.r+','+rgb.g+','+rgb.b+',0.2'+')'
        })
      }
      this.setState({
        user: user
      })
    })
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll)
  }

  handleScroll () {
    let winScroll = document.body.scrollTop || document.documentElement.scrollTop
    let height = document.documentElement.scrollHeight - document.documentElement.clientHeight
    window.localStorage.setItem('scrollY', winScroll)
  }

  render () {
    if (!isEmpty(this.state.error)) {
      return (
        <div>
          <h1 id='title'> Emoji <img id='heart-title' src='../images/emoji-svg/2764.svg'/> Pets </h1>
          <button id="home-btn" onClick={() => this.props.history.go(-1)}>Back</button>
          <h1 id='fourohfour-error'>404</h1>
          <h1 id="profile-name"> Oops! User not found! <br /> Click Back to go back.</h1>
        </div>
      )
    }
    return (
      <div className='profile-container'>
        <h1 id='title'> Emoji <img id='heart-title' src='../images/emoji-svg/2764.svg'/> Pets </h1>
        <button id="home-btn" onClick={() => this.props.history.go(-1)}>Back</button>
        { this.state.user && showUser(this.state.user) } <br />
        <p className='items-tag'>Pets </p><br /><br />
        { this.state.user && showPets(this.state.user, this.props.history) }
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

function goToPet (username, petname, routeHistory) {
  routeHistory.push(`/pet/${username}/${petname}`)
}

function showPets (usrInfo, routeHistory) {
  let petNames = Object.keys(usrInfo.pets)
  return petNames.map((name, i) =>
    <div className='user-items' id={`pet${i}`} key={i} onClick={() => goToPet(usrInfo.username, name, routeHistory)}>
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
