import React, { Component } from "react"
import PropTypes from "prop-types"


class Item extends Component {
  constructor (props) {
    super (props)
    this.state = {
      itemID: this.props.itemID,
      src: this.props.src,
      price: this.props.price
    }
  }
  render () {
    return (
      <div className='item-container'>
        <img src={this.state.src} itemID={this.state.itemID}/>
        <p>Price: {this.state.price} coins</p>
        <button id='buy-btn' itemID={this.state.itemID}>{buyOrAdopt(this.state.itemID)}</button>
      </div>
    )
  }
}

function addToWallet (itemPath, acc) {
}

function removeFromMarket () {

}

function buyOrAdopt (id) {
  let petMin = parseInt('1f400', 16)
  let petMax = petMin + 25
  let emojiId = parseInt(id, 16)
  return (petMin <= emojiId && emojiId <= petMax) ? 'adopt' : 'buy'
}

export default Item
