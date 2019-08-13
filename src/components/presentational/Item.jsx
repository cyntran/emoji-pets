import React, { Component } from "react"
import PropTypes from "prop-types"
import PetForm from "./PetForm.jsx"
import ProgressBar from  "./ProgressBar.jsx"
import config from "../../../clientConfig.js"
import { withRouter } from 'react-router-dom'
import { getBackground } from '../../getRGBAverage.js'
let dollarBtn = '/images/emoji-svg/1f4b0.svg'
let hourGlass = '/images/emoji-svg/23f3.svg'
let clipboard = '/images/emoji-svg/1f4cb.svg'


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
      errorMsg: false,
      background: false,
      showPetProfile: false
    }
    this.handleShowPetProfile = this.handleShowPetProfile.bind(this)
    this.handleCloseProfile = this.handleCloseProfile.bind(this)
  }

  nextPath (path) {
    this.props.history.push(path)
  }

  handleBuy () {
    fetch(`${config.apiUrl}/profile`, { credentials: 'include' })
    .then((res) => {
      if (res.ok) {
        this.setState({ signedIn: true })
        fetch(`${config.apiUrl}/forsale/item/${this.state.name}`)
        .then(res => res.json())
        .then(data => {
          if (data.isAnimal && !data.petData.prevOwner) {
            this.setState({ showModal: true })
            return
          } else {
            fetch(`${config.apiUrl}/item/buy`, {
              method: 'POST',
              body: JSON.stringify({buyData: data, item: this.state.item}),
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json'
              }
            })
            .then(res => {
              if (!res.ok) {
                this.setState({ errorMsg: true })
                return
              } else {
                this.setState({
                  showPurchasingDiv: true
              })
              return res.json()
              }
            })
            .then(res => {
              if (!this.state.errorMsg) {
                setTimeout(() => window.location = '/', 3000)
              } else {
                setTimeout(() => window.location.reload(), 3000)
              }
            })
          }
        })
      } else {
        this.setState({ signedIn: false })
      }
    })
  }

  componentDidMount () {
    getBackground(this.state.item.path).then((rgb) => this.setState({background: 'rgb('+rgb.r+','+rgb.g+','+rgb.b+',0.2'+')'}))
  }

  handleShowPetProfile () {
    this.setState({
      showPetProfile: true
    })
  }

  handleCloseProfile () {
    this.setState({
      showPetProfile: false
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
      <div className='item-container' style={{ background: this.state.background }}>
        { this.state.showPetProfile && displayInfo(this.state.item, this.handleCloseProfile)}
        { this.state.item.petData && this.state.item.petData.prevOwner &&
          <div style={{'background':'#00000', 'width': '100%'}}>
            <p className='prev-own-tag'>previously owned</p>
          </div>
        }
        {this.state.showPurchasingDiv && <div id='purchasing-div'><img src={hourGlass} id='hourglass'/>Purchasing, please wait.</div>}
        <img className='emoji-buy' src={this.state.item.path} name={this.state.name}/>
        <p id='item-cost'><img id='doll-img' src={dollarBtn} />{this.state.price}</p>
        { (this.state.item.petData && this.state.item.petData.prevOwner) &&
            <h1 style={{'color':'#5f5d5d94', 'margin': '0', 'lineHeight':'0.7'}}>
              Name: {this.state.item.name}
            </h1>
        }
        { this.state.item.quantity && <p id='item-quan'>{this.state.item.quantity} left!</p>} <br />
        <button id='buy-btn' name={this.state.name}
          onClick={() => this.handleBuy()}>
          { animalOrItem(this.state.item) }</button>
        { this.state.item.petData && this.state.item.petData.prevOwner &&
          <img src={clipboard} onClick={() => this.handleShowPetProfile()} id='clipboard-btn'></img>
        }
        { !this.state.signedIn && <div id='login-buy'>{emojiHand} Please log in to purchase.</div> }
        { this.state.errorMsg && <div id='login-buy'> Sorry, you do not have enough funds. </div> }
        { this.state.showModal && <PetForm handleModal={this.checkClose} name={this.state.name} item={this.state.item}/> }
      </div>
    )
  }
}

function displayInfo (pet, close) {
  return (
    <div id='pet-prof-buy'>
      <img src={clipboard} id='clipboard-img'/>
        <div id='adopt-prevPet-info'>
        <h1 id='pet-prof-stat-h1'>{pet.name}'s stats'</h1>
        <div id='pet-prof-stat-buy'>
          { getStats(pet.petData) }
        </div>
        <button id='close-btn-pet-prof-buy' onClick={() => close()}>
        Close
        </button>
      </div>
    </div>
  )
}

function getStats (petData) {
  let progressObj = (({happiness, hunger, health, intelligence, charisma, attractiveness}) =>
    ({happiness, hunger, health, intelligence, charisma, attractiveness}))(petData)
  return Object.keys(progressObj).map((key, i) => {
    return (
      <div className='pet-info-div' key={key + '-trait'}>
        <span className='pet-profile-span'>{key}: </span>
          <ProgressBar now={progressObj[key]}/>
          <span className='pet-data'> {progressObj[key]}/100 </span><br />
      </div>
    )
  })
}

function animalOrItem (item) {
  return (item.isAnimal) ? 'adopt' : 'buy'
}


export default withRouter(Item)
