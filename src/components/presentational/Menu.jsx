import React, { Component } from "react"
import PropTypes from "prop-types"
import { withRouter } from 'react-router-dom'

class Menu extends Component {
  nextPath (path) {
    this.props.history.push(path)
  }
  render () {
    return (
      <div className = "menu-container">
        <button id="adopt-btn" onClick={() => this.nextPath('/forsale')}> Adopt a pet!</button>
      </div>
    )
  }
}


export default withRouter(Menu)
