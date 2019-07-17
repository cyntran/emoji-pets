import React, { Component } from "react"
import ReactDOM from "react-dom"

class ItemModal extends Component {
  constructor (props) {
    super (props)
    this.state = {
      isHidden: false,
      item: this.props.item,
      pets: this.props.pets
    }
  }

  toggleHidden () {
    this.props.handleModal(true)
    this.setState({
      isHidden: true
    })
  }

  render () {
    return (
      <div className='modal item-modal'>
      <img src={this.state.item.path} className='item-img'/>
        <div className='feed-div'>
          <select className='pet-feed-select'>
            { getAnimalSelection(this.state.pets) }
          </select>
          <button className='item-btn feed-btn' onClick={() => console.log('hi')}>feed</button>
        </div>
        <br />
        <button className='item-btn sell-btn'>sell</button>
        <br />
      <button className='item-btn close-btn' onClick={this.toggleHidden.bind(this)}>x</button>
      </div>
    )
  }
}

function getAnimalSelection (pets) {
  let petArr = Object.keys(pets)
  return petArr.map((name, i) =>
    <option value={name} key={i}>{name}</option>
  )
}

export default ItemModal
