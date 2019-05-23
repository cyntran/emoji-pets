import React, { Component } from "react"
import PropTypes from "prop-types"
import Item from "./Item.jsx"

class MarketPlace extends Component {
  constructor () {
    super()
    this.state = {
      items: []
    }
  }
  componentDidMount () {
    getForSale().then(arr => this.setState({ items: arr }))
  }

  render () {
    const { items } = this.state
    return (
      <div className= "market-container">
        {items.map((item, i) => <Item src={item} itemID={i} key={i}/>)}
      </div>
    )
  }
}

async function getForSale () {
  let response = await fetch(`http://localhost:8080/forsale`)
  let data = await response.json()
  return data
}

export default MarketPlace
