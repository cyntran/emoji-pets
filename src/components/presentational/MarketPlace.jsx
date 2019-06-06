import React, { Component } from "react"
import PropTypes from "prop-types"
import Item from "./Item.jsx"
import Menu from "./Menu.jsx"
import config from "../../../clientConfig.js"


class MarketPlace extends Component {
  constructor () {
    super()
    this.state = {
      items: [],
      user: false,
      displayMenu: false,
    }
    this.handleSearch = this.handleSearch.bind(this)
    this.handleScroll = this.handleScroll.bind(this)
  }
  componentDidMount () {
    window.addEventListener('scroll', this.handleScroll)
    let scrollPs = localStorage.getItem('scrollY')
    if (scrollPs) {
      setTimeout(() => window.scrollTo(0, scrollPs), 200)
    }
    getForSale().then((val) => {
      if (!val.error) {
        this.setState({ items: val })
      } else {
        this.setState({ items: false })
      }
    })
    getUser()
      .then((userData) => {
        if (userData.message) {
          this.setState({ displayMenu: true })
        } else {
          this.setState({ user: userData})
      }
    })
  }

  componentWillMount() {
    window.removeEventListener('scroll', this.handleScroll)
  }

  nextPath (path) {
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
      <div className= "market-container">
        { !displayMenu(this.state.displayMenu) && <button id='wallet-amt-btn'>Coins:
          {this.state.user.balance}</button> }
        <label id='search-lbl'>Find a friend:
          <input id='search-box' placeholder='Enter username' name='search-user' onKeyPress={this.handleSearch}>
          </input>
        </label><br /><br />
        <h1 id='title'> Emoji <img id='heart-title' src='../images/emoji-svg/2764.svg'/> Pets </h1>
        { displayMenu(this.state.displayMenu) }
        <button id="home-btn" onClick={() => this.nextPath('/')}>Dashboard</button>
        <h1 id='market-text'>Welcome to the marketplace!</h1>
        { parseItems(this.state.items) }
      </div>
    )
  }
}

function displayMenu (display) {
  if (display) {
    document.querySelector('#title').style.marginTop = '10px'
    return <Menu />
  }
}

function displayPetForm (display) {
  if (display) {
    return <PetForm />
  }
}

// TODO: right now, the itemID is just the unicode value.
// Create a random string for item ID for new market place items.
function parseItems (items) {
  return items.map((item, i) =>
    <Item key={i} item={item}/>)
}

async function getUser () {
  let response = await fetch(`${config.apiUrl}/profile`, { credentials: 'include' })
  if (response.ok) {
    return response.json()
  } else {
    return {
      message: 'Cannot retrieve account.'
    }
  }
}

async function getForSale () {
  let response = await fetch(`${config.apiUrl}/forsale`, { credentials: 'include' })
  let data = await response.json()
  return data
}


export default MarketPlace
