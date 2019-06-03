import React, { Component } from "react"
import PropTypes from "prop-types"
import Item from "./Item.jsx"
import Menu from "./Menu.jsx"
// import Modal from "./Modal.jsx"

class MarketPlace extends Component {
  constructor () {
    super()
    this.state = {
      items: [],
      user: false,
      displayMenu: false,
    }
  }
  componentDidMount () {
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
  nextPath (path) {
    this.props.history.push(path)
  }

  render () {
    return (
      <div className= "market-container">
        <h1 id='title'> Emoji <img id='heart-title' src='../images/emoji-svg/2764.svg'/> Pets </h1>
        { displayMenu(this.state.displayMenu) }
        <button id="home-btn" onClick={() => this.nextPath('/')}>Profile</button>
        <h1 id='market-text'>Welcome to the marketplace!</h1>
        {parseItems(this.state.items)}
      </div>
    )
  }
}

function displayMenu (display) {
  if (display) {
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
  let response = await fetch(`http://localhost:8080/profile`, { credentials: 'include' })
  if (response.ok) {
    return response.json()
  } else {
    return {
      message: 'Cannot retrieve account.'
    }
  }
}

async function getForSale () {
  let response = await fetch(`http://localhost:8080/forsale`, { credentials: 'include' })
  let data = await response.json()
  return data
}


export default MarketPlace
