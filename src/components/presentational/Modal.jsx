import React, { Component } from "react"
import PropTypes from "prop-types"

class Modal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      isHidden: false
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
      <div className='modal'>
        <button id='close-modal-btn' onClick={this.toggleHidden.bind(this)}>Close</button>
        <button id='enter-modal-btn'>Enter</button>
      </div>
    )
  }
}

export default Modal
