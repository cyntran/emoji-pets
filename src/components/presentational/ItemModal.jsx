import React, { Component } from "react"
import ReactDOM from "react-dom"
import config from "../../../clientConfig.js"

class ItemModal extends Component {
  constructor (props) {
    super (props)
    this.state = {
      isHidden: false,
      item: this.props.item,
      pets: this.props.pets,
      error: false,
      showNotif: false
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
    })
  }

  render () {
    if (this.state.showNotif) {
      console.log('show notif is true')
      return (
        <div id='feed-modal'>
          <div id='feed-notification'>
             <p id='feed-notification-txt'> You just fed your pet a food! </p>
           </div>
        </div>
      )
    } else {
      console.log('show notif is false')
      return (
        <div className='modal item-modal'>
          <img src={this.state.item.path} className='item-img'/>
          { this.state.error && <p id='error-feed'> Oops, can't feed! </p> }
          {!this.state.error && (<div className='feed-div'>
            <select className='pet-feed-select'>
              { getAnimalSelection(this.state.pets) }
            </select>
            <button className='item-btn feed-btn' onClick={this.toggleFeed.bind(this)}>feed</button>
          </div>)}
          <br />
          <button className='item-btn sell-btn'>sell</button>
          <br />
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
