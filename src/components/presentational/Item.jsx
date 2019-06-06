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
      showModal: false,
      showPurchasingDiv: false,
      errorMsg: false
    }
  }

  handleBuy () {
    fetch('http://localhost:8080/profile', { credentials: 'include' })
    .then((res) => {
      if (res.ok) {
        this.setState({ signedIn: true })
        console.log('this.state.name', this.state.name)
        fetch(`http://localhost:8080/forsale/item/${this.state.name}`)
        .then(res => res.json())
        .then(data => {
          if (!data.petData.prevOwner && data.isAnimal) {
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
            }).then(res => {
              if (!res.ok) {
                this.setState({ errorMsg: true })
                setTimeout(() => window.location.reload(), 2000)
              } else {
                this.setState({
                  showPurchasingDiv: true
                })
                setTimeout(() => window.location.reload(), 1000)
              }
            })
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
        {this.state.showPurchasingDiv && <div id='purchasing-div'>Purchasing, please wait.</div>}
        <img src={this.state.item.path} name={this.state.name}/>
        <p className='item-description'>Price: {this.state.price} coins</p>
        { this.state.item.petData.prevOwner && <p className='item-description'>Name: {this.state.item.name}</p> }
        {this.state.item.quantity && <p className='item-description'>Quantity: {this.state.item.quantity}</p>}
        <button id='buy-btn' name={this.state.name}
          onClick={() => this.handleBuy()}>
          { animalOrItem(this.state.item) }</button>
        { !this.state.signedIn && <div id='login-buy'>{emojiHand} Please log in to purchase.</div> }
        { this.state.errorMsg && <div id='login-buy'> Sorry, you do not have enough funds. </div> }
        { this.state.showModal && <PetForm handleModal={this.checkClose} name={this.state.name} item={this.state.item}/> }
      </div>
    )
  }
}


function animalOrItem (item) {
  return (item.isAnimal) ? 'adopt' : 'buy'
}

export default Item
