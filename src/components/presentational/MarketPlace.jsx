import React, { Component } from "react"
import PropTypes from "prop-types"
import Item from "./Item.jsx"
import Menu from "./Menu.jsx"
import Modal from "./Modal.jsx"

class MarketPlace extends Component {
  constructor () {
    super()
    this.state = {
      items: [],
      isHidden: true
    }
  }
  componentDidMount () {
    getForSale().then(arr => this.setState({ items: arr }))
  }
  nextPath (path) {
    this.props.history.push(path)
  }
  checkHidden = (data) => {
    this.setState({ isHidden: data })
  }
  render () {
    const { items } = this.state
    return (
      <div className= "market-container">
        <h1 id='title'> Emoji <img id='heart-title' src='../images/emoji-svg/2764.svg'/> Pets </h1>
        <Menu handleModal={this.checkHidden}/>
        <button id="home-btn" onClick={() => this.nextPath('/')}> Go Back </button>
        {!this.state.isHidden && <Modal handleModal={this.checkHidden}/>}
        <h1 id='market-text'>Welcome to the marketplace!</h1>
        {parseItems (items)}
      </div>
    )
  }
}

function parseItems (items) {
  return items.map((item, i) =>
    <Item src={item.path} itemID={item.path.slice(20)} key={i} price={item.price}/>)
}

async function getForSale () {
  let response = await fetch(`http://localhost:8080/forsale`)
  let data = await response.json()
  return data
}


export default MarketPlace
