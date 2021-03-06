import React, { Component } from "react"
import ReactDOM from "react-dom"
import Menu from "../presentational/Menu.jsx"
import UserItem from "../presentational/UserItem.jsx"
import '../../css/styles.css'
import config from "../../../clientConfig.js"
import { getBackground } from '../../getRGBAverage.js'
let coinBtn = '/images/emoji-svg/1f4b0.svg'


class MainContainer extends Component {
  constructor () {
    super ()
    this.state = {
      user: false,
      msg: false,
      cuteDuck: false,
      showSignIn: false,
      sellMsg: null
    }
    this.handleSearch = this.handleSearch.bind(this)
    this.handleScroll = this.handleScroll.bind(this)
  }

  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll)
    let scrollPs = localStorage.getItem('scrollY')
    if (scrollPs) {
      setTimeout(() => window.scrollTo(0, scrollPs), 200)
    }

    getProfile()
    .then(prof => {
      if (prof.message) {
        this.setState({
          msg: prof.message,
          cuteDuck: prof.imgPath,
          showSignIn: true
        })
      } else {
        this.setState ({
          user: prof
        })
        let arr = Object.values(prof.items).concat(Object.values(prof.pets))
        for (let i = 0; i < arr.length; i++) {
          getBackground(arr[i].path).then((rgb) => {
            document.querySelector(`#${arr[i].name}, .items`).style.background ='rgb('+rgb.r+','+rgb.g+','+rgb.b+',0.2'+')'
          })
        }
      }
    })
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll)
  }

  nextPath(path) {
    this.props.history.push(path)
  }

  handleSearch (e) {
    if (e.key == 'Enter') {
      this.nextPath(`/profile/${e.target.value}`)
    }
  }

  handleScroll () {
    let winScroll = document.body.scrollTop || document.documentElement.scrollTop
    let height = document.documentElement.scrollHeight - document.documentElement.clientHeight
    window.localStorage.setItem('scrollY', winScroll)
  }

  render () {
    return (
      <div id='main-container'>
        <label id='search-lbl'>Find a friend:
          <input id='search-box' placeholder='Enter username' name='search-user' onKeyPress={this.handleSearch}>
          </input>
        </label><br /><br />
        <h1 id='title'> Emoji <img id='heart-title' src='../images/emoji-svg/2764.svg'/> Pets </h1>
        { displayMenu(this.state.showSignIn) }
        <button id="adopt-btn" onClick={() => this.nextPath('/forsale')}>{isEmpty(this.state.user.pets) ? 'Adopt a pet!' : 'Browse the market!'}</button><br />
        { this.state.user && <button id='sign-out-btn' onClick={() => logout()}>Log out</button> }
        { this.state.user && showWallet(this.state.user, this.props.history)}
        { this.state.cuteDuck && <img id='cute-duck-img' src={this.state.cuteDuck}/> } <br />
        { this.state.msg && <h1 id='login-msg'>{this.state.msg}</h1> }
      </div>
    )
  }
}

function handleSell (petName, info) {
  fetch(`${config.apiUrl}/item/sell`, {
    method: 'POST',
    body: JSON.stringify({ name: petName, info: info }),
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then((res) => {
    if (res.ok) {
      // TODO: Shouldn't reload the whole page, just the component.
      // Extract out showWallet, showPets, handleSell into own component.
      // Then you can rerender that component by setting the state there.
      window.location = '/'
    }
  })
}

function displayMenu(display) {
  if (display) {
    document.querySelector('#title').style.marginTop = '10px'
    return <Menu />
  }
}

function logout() {
  fetch(`${config.apiUrl}/signout`, { credentials: 'include' })
    .then(window.location.replace('/'))
}

function showWallet (usrInfo, routeHistory) {
  let nothing = <h1 id='no-purchases' style={{'fontSize':'3rem', 'color':'#808080ad'}}> Nothing yet </h1>
  return (
    <div id='wallet-group'>
      <h1 id='your-wallet'>{usrInfo.username}'s dashboard </h1>
      <button id='wallet-amt-btn'>
        <img id='coin-img' src={coinBtn}/>
        <span id='coin-amt'>{usrInfo.balance}</span>
      </button>
      <p className='items-tag'>Pets</p>
      <br />
      { !isEmpty(usrInfo.pets) ? showPets(usrInfo, routeHistory) : nothing }
      <p className='items-tag'>Items</p>
      <br />
      { !isEmpty(usrInfo.items) ? showItems(usrInfo, routeHistory) : nothing }
    </div>
  )
}

function showPets (usrInfo, routeHistory) {
  let petNames = Object.keys(usrInfo.pets)
  return petNames.map((name, i) =>
    <div className='pet-items' id={name} key={i} style={{ background: usrInfo.pets[name].background }}>
      <div onClick={() => goToPet(usrInfo.username, name, routeHistory)}>
        <p className='see-bio-text'> click me! </p>
        <img src={usrInfo.pets[name].path} id='pet'/>
        <p id='pet-name'>{name}</p>
        <p id='pet-health'>Health: {usrInfo.pets[name].petData.health}</p><br />
        <p id='pet-age'>Generation: {usrInfo.pets[name].petData.generation}</p>
      </div>
      <button className='sell-btn' onClick={() => handleSell(name, usrInfo.pets[name])}> sell </button>
    </div>
  )
}


// TODO: Display Item as own self-contained component here.
// Pass into props toggle for close
function showItems (usrInfo, routeHistory) {
  let items = Object.keys(usrInfo.items)
  return items.map((name, i) =>
    <UserItem pets={usrInfo.pets} user={usrInfo} item={usrInfo.items[name]} key={i}/>
  )
}

function goToPet (username, petname, routeHistory) {
  routeHistory.push(`/pet/${username}/${petname}`)
}

async function getProfile () {
  let response = await fetch(`${config.apiUrl}/profile`, { credentials: 'include' })
  if (response.ok) {
    let data = await response.json()
    return data
  } else {
    let cuteDuck = await getAnimal('1f423')
    return {
      message: 'Sign to see your profile!',
      imgPath: cuteDuck
    }
  }
}

// checks if object is empty
function isEmpty (obj) {
  obj = obj || {}
  return Object.keys(obj).length === 0 && obj.constructor === Object
}

async function getAnimal (unicode) {
  let response = await fetch(`${config.apiUrl}/item/${unicode}`, { credentials: 'include' })
  let data = await response.json()
  return data.path
}

export default MainContainer
