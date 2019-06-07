import React, { Component } from "react"
import PropTypes from "prop-types"
import SignInModal from "./SignInModal.jsx"
import SignUpModal from "./SignUpModal.jsx"

class Menu extends Component {
  constructor() {
    super()
    this.state = {
      isHidden: true,
      type: null
    }
  }

  toggleSignIn() {
    this.setState({
      type: 'sign-in',
      isHidden: false
    })
  }

  toggleCreate() {
    this.setState({
      type: 'create',
      isHidden: false
    })
  }

  checkHidden = (data) => {
    this.setState({ isHidden: data})
  }

  render () {
    return (
      <div className = "menu-container">
        { !this.state.isHidden && this.state.type === 'sign-in' && <SignInModal handleModal={this.checkHidden}/> }
        { !this.state.isHidden && this.state.type === 'create' && <SignUpModal handleModal={this.checkHidden}/> }
        <button id='sign-in-btn' onClick={this.toggleSignIn.bind(this)}>Sign In</button>
        <button id='create-acc-btn' onClick={this.toggleCreate.bind(this)}>Create Account</button>
      </div>
    )
  }
}


export default Menu;
