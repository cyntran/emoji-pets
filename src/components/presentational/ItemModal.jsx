import React, { Component } from "react"
import ReactDOM from "react-dom"
import config from "../../../clientConfig.js"

class ItemModal extends Component {
  constructor (props) {
    super (props)
    this.state = {
      isHidden: false,
      user: this.props.user,
      item: this.props.item,
      pets: this.props.user.pets,
      error: false,
      showNotif: false,
      feedNum: 0
    }
    this.toggleFeed = this.toggleFeed.bind(this)
  }

  toggleHidden () {
    this.props.handleModal(true)
    this.setState({
      isHidden: true
    })
  }

  toggleFeed (petName) {
    let item = this.state.item
    let pets = this.state.pets
    let petInfo = pets[petName]
    fetch(`${config.apiUrl}/action/feed`, {
      method: 'POST',
      body: JSON.stringify({ food: item.unicode, pet: petInfo }),
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      if (response.ok) {
        this.setState({
          showNotif: true
        })
      } else {
        this.setState({
          error: true
        })
      }
      return response.json()
    })
    .then((res) => {
      if (res.petData && res.petData.feeding.number < 3) {
        this.setState({
          feedNum: res.petData.feeding.number
        })
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
    })
  }

  render () {
    if (this.state.showNotif) {
      let response = (!this.state.feedNum) ? `You can't feed your pet anymore today!` : `You can feed your pet ${3 - this.state.feedNum} more times today.`
      return (
        <div id='feed-modal'>
          <div id='feed-notification'>
             <img src={this.state.item.path} id='fed-food-img'/>
             <p id='feed-notification-txt'> You just fed your pet a {this.state.item.product}!<br />Refreshing...</p>
             <p id='feed-num-txt'> {response} </p>
           </div>
        </div>
      )
    } else {
      return (
        <div className='item-modal'>
          <img src={this.state.item.path} className='item-img'/>
          { this.state.error && <p id='error-feed'> You can't feed your pet anymore today! <br />Refreshing...</p> }
          {!this.state.error &&
            (<div>
              <p id='select-pet-feed-txt'> Select Pet To Feed </p>
              <div style={{'overflow': 'scroll', 'height': '250px', 'background': '#0000006b'}}>
                { getAnimalSelection(this.state.pets, this.toggleFeed) }
              </div>
              <br />
              <button className='sell-btn' onClick={() => sellItem(this.state.item.unicode, this.state.item)}>sell {this.state.item.product}</button>
            </div>
          )}
          <button className='item-btn close-btn' onClick={this.toggleHidden.bind(this)}>x</button>
        </div>
      )
    }
  }
}

function sellItem (itemName, itemInfo) {
  fetch(`${config.apiUrl}/item/sell`, {
    method: 'POST',
    body: JSON.stringify({
      name: itemName,
      info: itemInfo
    }),
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(res => {
    if (res.ok) {
      window.location = '/'
    }
  })
}

function getAnimalSelection (pets, feed) {
  return Object.values(pets).map((pet, i) =>
  <span key={i} style={{ 'margin': '8px', 'padding': '0', 'display':'inline-block' }}>
    <img className='pet-feed-choice' src={pet.path} id={pet.name} onClick={() => feed(pet.name)}/>
    <p style={{ 'margin': '0', 'fontSize': '1.5rem', 'marginTop': '-10px', 'color': 'white' }}> { pet.name } </p>
  </span>
  )
}

export default ItemModal
