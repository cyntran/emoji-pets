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
  }

  toggleHidden () {
    this.props.handleModal(true)
    this.setState({
      isHidden: true
    })
  }

  toggleFeed () {
    let item = this.state.item
    let pets = this.state.pets
    let e = document.querySelector('.pet-feed-select')
    let petName = e.options[e.selectedIndex].value
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
          window.location = `/pet/${this.state.user.username}/${petName}`
        }, 2000)
      } else {
        window.location.reload()
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
        <div className='modal item-modal'>
          <img src={this.state.item.path} className='item-img'/>
          { this.state.error && <p id='error-feed'> Oops, can't feed!<br />Refreshing...</p> }
          {!this.state.error &&
            (<div className='feed-div'>
            <select className='pet-feed-select'>
              { getAnimalSelection(this.state.pets) }
            </select>
            <button className='item-btn feed-btn' onClick={this.toggleFeed.bind(this)}>feed</button>
            <br />
            <button className='sell-btn'>sell</button>
          </div>)}
          <button className='item-btn close-btn' onClick={this.toggleHidden.bind(this)}>x</button>
        </div>
      )
    }
  }
}


function getAnimalSelection (pets) {
  let petArr = Object.keys(pets)
  return petArr.map((name, i) =>
    <option value={name} key={i}>{name}</option>
  )
}

export default ItemModal
