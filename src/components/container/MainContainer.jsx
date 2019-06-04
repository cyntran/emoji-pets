import React, { Component } from "react"
import ReactDOM from "react-dom"
import Menu from "../presentational/Menu.jsx"
import '../../css/styles.css'

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
  }

  componentDidMount() {
    getProfile()
      .then((res) => {
      if (res.message) {
        this.setState({
          msg: res.message,
          cuteDuck: res.imgPath,
          showSignIn: true
        })
      } else {
        this.setState({
          user: res
        })
      }
    })
  }

  nextPath(path) {
    this.props.history.push(path)
  }

  handleSearch (e) {
    if (e.key == 'Enter') {
      console.log(e.target.value)
      this.nextPath(`/profile/${e.target.value}`)
    }
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
        <button id="adopt-btn" onClick={() => this.nextPath('/forsale')}>{!this.state.user.animal ? 'Adopt a pet!' : 'Browse the market!'}</button><br />
        { this.state.user && <button id='sign-out-btn' onClick={() => logout()}>Log out</button> }
        { this.state.user && showWallet(this.state.user)}
        { this.state.cuteDuck && <img id='cute-duck-img' src={this.state.cuteDuck}/> } <br />
        { this.state.msg && <h1 id='login-msg'>{this.state.msg}</h1> }
      </div>
    )
  }
}

function handleSell (petName, info) {
  fetch(`http://localhost:8080/item/sell`, {
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
      window.location.reload()
    }
  })
}

function displayMenu(display) {
  if (display) {
    return <Menu />
  }
}

function logout() {
  fetch('http://localhost:8080/signout', { credentials: 'include' })
    .then(window.location.replace('/'))
}

function showWallet (usrInfo) {
  return (
    <div id='wallet-group'>
      <h1 id='your-wallet'> Your Wallet </h1>
      <h2 id='balance'> Your Balance: { usrInfo.balance } coins </h2>
      {showPets(usrInfo)}
    </div>
  )
}

function showPets (usrInfo) {
  let petNames = Object.keys(usrInfo.pets)
  console.log(`user's pet's names: ${JSON.stringify(usrInfo.pets, null, 2)}`)
  return petNames.map((name, i) =>
    <div className='pets-container' key={i}>
      <img src={usrInfo.pets[name].path} id='pet'/>
      <p id='pet-name'>{name}</p>
      <p id='pet-age'>age: {usrInfo.pets[name].age}</p>
      <button className='sell-btn' onClick={() => handleSell(name, usrInfo.pets[name])}> Sell </button>
    </div>
  )
}

async function getProfile () {
  let response = await fetch(`http://localhost:8080/profile`, { credentials: 'include' })
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

async function getAnimal (unicode) {
  let response = await fetch(`http://localhost:8080/item/${unicode}`, { credentials: 'include' })
  let data = await response.json()
  return data.path
}

export default MainContainer
