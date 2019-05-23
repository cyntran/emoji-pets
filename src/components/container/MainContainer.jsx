import React, { Component } from "react"
import ReactDOM from "react-dom"
import Input from "../presentational/Input.jsx"
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

  render () {
    return (
      <div id='wallet-group'>
        <Menu />
        <h1 id='your-wallet'> Your Wallet </h1>
        <img src={this.state.animal}/>
        <h2 id='balance'> Your Balance: { this.state.balance } coins </h2>
      </div>
    )
  }
}

async function getAnimal (unicode) {
  let response = await fetch(`http://localhost:8080/item/${unicode}`)
  let data = await response.json()
  return data
}

export default MainContainer
