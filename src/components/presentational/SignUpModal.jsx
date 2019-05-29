import React, { Component } from "react"
import PropTypes from "prop-types"

class SignUpModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      isHidden: false
    }
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleSubmit (e) {
    e.preventDefault()
    const data = {}
    let parseData = new FormData(e.target)

    parseData.forEach((v, k) => {
      data[k] = v
    })

    fetch('http://localhost:8080/signup', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(res => res.json())
    .then(val => console.log(val))
  }

  toggleHidden () {
    this.props.handleModal(true)
    this.setState({
      isHidden: true
    })
  }

  render () {
    return (
      <div className='modal' id='sign-up-modal'>
        <h1 className='acc-h1'>Create your account!</h1>
        <form onSubmit={this.handleSubmit} className='sign-in'>
          <label>Name: <br/ ><input type='text' name='name' data-parse='lowercase'/></label><br />
          <label>Email Address: <br/ ><input type='text' name='email' data-parse='lowercase'/></label><br />
          <label>Password: <br /><input type='password' name='password' data-parse='lowercase'/></label>
          <button id='close-modal-btn' onClick={this.toggleHidden.bind(this)}>Close</button>
          <input type='submit' id='enter-modal-btn' value='Submit!'/>
        </form>
      </div>
    )
  }
}



export default SignUpModal
