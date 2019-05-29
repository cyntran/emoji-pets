import React, { Component } from "react"
import ReactDOM from "react-dom"
import Menu from "../presentational/Menu.jsx"
import '../../css/styles.css'

class MainContainer extends Component {
  constructor () {
    super ()
    this.state = {
      balance: 10
    }
  }
  componentDidMount() {
    getAnimal('1f0cf').then((val) => this.setState({ animal: val }))
  }

  nextPath(path) {
    this.props.history.push(path)
  }

  render () {
    return (
      <div id='main-container'>
        <h1 id='title'> Emoji <img id='heart-title' src='../images/emoji-svg/2764.svg'/> Pets </h1>
        <Menu />
        <div id='wallet-group'>
          <button id="adopt-btn" onClick={() => this.nextPath('/forsale')}> Adopt a pet!</button>
          <h1 id='your-wallet'> Your Wallet </h1>
          <img src={this.state.animal} id='pet'/>
          <h2 id='balance'> Your Balance: { this.state.balance } coins </h2>
        </div>
      </div>
    )
  }
}

async function getAnimal (unicode) {
  let response = await fetch(`http://localhost:8080/item/${unicode}`, { credentials: 'include' })
  let data = await response.json()
  return data.path
}

export default MainContainer
