import React, { Component } from "react"
import PropTypes from "prop-types"

class SignInModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      isHidden: false,
      value: 'hi'
    }
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleChange (e) {
    console.log('i am changing')
    this.setState({
      value: e.target.value
    })
  }

  handleSubmit (e) {
    e.preventDefault()
    const data = {}
    let parseData = new FormData(e.target)

    parseData.forEach((v, k) => {
      data[k] = v
    })

    fetch('http://localhost:8080/login', {
      method: 'POST',
      body: JSON.stringify(data),
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    })
    .then(response => {
      if (response.ok) {
        window.location.replace('/')
        return
      } else {
        console.log('you have not signed in')
      }
     })
  }

  toggleHidden () {
    this.props.handleModal(true)
    this.setState({
      isHidden: true
    })
  }

  render () {
    return (
      <div className='modal' id='sign-in-modal'>
        <h1 className='acc-h1'>Sign in!</h1>
        <form onSubmit={this.handleSubmit} className='sign-in' >
          <label>Email Address: <br /><input name='email' type='text'/></label><br />
          <label>Password: <br /><input name='password' type='password'/></label>
          <button id='close-modal-btn' onClick={this.toggleHidden.bind(this)}>Close</button>
          <input type='submit' id='enter-modal-btn' value='Submit!'/>
        </form>
      </div>
    )
  }
}


export default SignInModal
