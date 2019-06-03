import React, { Component } from "react"
import PropTypes from "prop-types"
import PetForm from "./PetForm.jsx"

class Item extends Component {
  constructor (props) {
    super (props)
    let name = (!this.props.item.name ? this.props.item.unicode : this.props.item.name)
    this.state = {
      name: name,
      src: this.props.item.path,
      price: this.props.item.price,
      item: this.props.item,
      signedIn: true,
      showModal: false
    }
    console.log(`Item state object: ${JSON.stringify(this.state, null, 2)}`)
  }

  handleBuy () {
    fetch('http://localhost:8080/profile', { credentials: 'include' })
    .then((res) => {
      if (res.ok) {
        this.setState({ signedIn: true })
        fetch(`http://localhost:8080/forsale/item/${this.state.name}`)
        .then(res => res.json())
        .then(data => {
          console.log(data)
          if (!data.prevOwner && data.isAnimal) {
            this.setState({ showModal: true })
            return
          } else {
            fetch(`http://localhost:8080/item/buy`, {
              method: 'POST',
              body: JSON.stringify({ name: this.state.name, info: this.state.item}),
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json'
              }
            }).then(window.location.reload())
          }
        })
      } else {
        this.setState({ signedIn: false })
      }
    })
  }

  checkClose = (closed) => {
    if (closed) {
      this.setState({
        showModal: false
      })
    }
  }

  render () {
    let emojiHand = (<img id='emoji-hand' src='../images/emoji-svg/1f446.svg'/>)
    return (
      <div className='item-container'>
        <img src={this.state.item.path} name={this.state.name}/>
        <p>Price: {this.state.price} coins</p>
        <button id='buy-btn' name={this.state.name}
          onClick={() => this.handleBuy()}>
          {animalOrItem(this.state.item.unicode)}</button>
        { !this.state.signedIn && <div id='login-buy'>{emojiHand} Please log in to purchase.</div> }
        { this.state.showModal && <PetForm handleModal={this.checkClose} name={this.state.name} item={this.state.item}/> }
      </div>
    )
  }
}


function animalOrItem (id) {
  let petMin = parseInt('1f400', 16)
  let petMax = petMin + 25
  let emojiId = parseInt(id, 16)
  return (petMin <= emojiId && emojiId <= petMax) ? 'adopt' : 'buy'
}

export default Item
