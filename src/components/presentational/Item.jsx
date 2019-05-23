import React, { Component } from "react"
import PropTypes from "prop-types"


class Item extends Component {
  constructor (props) {
    super (props)
    this.state = {
      itemID: this.props.itemID,
      src: this.props.src
    }
  }
  render () {
    console.log(this.state)
    return (
      <div id='item-container'>
        <img src={this.state.src} itemID={this.state.itemID}/>
        <p>Price: {}</p>
        <button id={this.state.itemID}>Buy</button>
      </div>
    )
  }
}



export default Item
