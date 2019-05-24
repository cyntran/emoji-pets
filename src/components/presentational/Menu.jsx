import React, { Component } from "react"
import PropTypes from "prop-types"
import { withRouter } from 'react-router-dom'

class Menu extends Component {
  constructor(props) {
    super(props)
    this.state = {
      isHidden: true
    }
  }

  toggleHidden () {
    this.props.handleModal(false)
    this.setState({
      isHidden: false
    })
  }

  render () {
    return (
      <div className = "menu-container">
        <button id='sign-in-btn' onClick={this.toggleHidden.bind(this)}>Sign In</button>
        <button id='create-acc-btn' onClick={this.toggleHidden.bind(this)}>Create Account</button>
      </div>
    )
  }
}


export default withRouter(Menu)
