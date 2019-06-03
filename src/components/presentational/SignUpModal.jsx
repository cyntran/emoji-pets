import React, { Component } from "react"
import PropTypes from "prop-types"


class SignUpModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      isHidden: false,
      errors: false,
      credentials: false
    }
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleSubmit (e) {
    e.preventDefault()
    let parseData = new FormData(e.target)
    let data = parseInput(parseData)
    let postData = data.data
    let errorData = data.errors

    this.setState({
      errors: errorData
    })

    if (!isEmpty(errorData)) {
      console.log(errorData)
      return
    }

    fetch('http://localhost:8080/signup', {
      method: 'POST',
      body: JSON.stringify(postData),
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      if (response.ok) {
        window.location.reload()
        return
      } else {
        return response.json()
      }
    })
    .then(res => {
      this.setState({
        credentials: Object.values(res)
      })
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
      <div className='modal' id='sign-up-modal'>
        <h1 className='acc-h1'>Create your account!</h1>
        {this.state.credentials && <p className='error-msg error-msg-credentials'>{this.state.credentials}</p>}<br />
        <form onSubmit={this.handleSubmit} className='sign-in'>

          <label>Username:
            {this.state.errors.username && <p className='error-msg' id='error-msg-name'>{this.state.errors.username}</p>}
            <br/ ><input type='text' name='username' data-parse='lowercase'/>
          </label><br />

          <label>Email Address:
            {this.state.errors.email && <p className='error-msg' id='error-msg-email'>{this.state.errors.email}</p>}
            <br/ ><input type='text' name='email' data-parse='lowercase'/>
          </label><br />

          <label>Password:
            {this.state.errors.password && <p className='error-msg' id='error-msg-pw'>{this.state.errors.password}</p>}
            <br /><input type='password' name='password' data-parse='lowercase'/>
          </label>

          <button id='close-modal-btn' onClick={this.toggleHidden.bind(this)}>Close</button>
          <input type='submit' id='enter-modal-btn' value='Submit!'/>
        </form>
      </div>
    )
  }
}

// helper functions below
function parseInput (parseData) {
  let data  = {}
  let errors = {}
  let eReg =  /\S+@\S+\.\S+/
  let uReg = /[^a-zA-Z0-]/
  parseData.forEach((v, k) => {
    if (!v) {
      errors[k] = `*Required: Please enter your ${k}.`
    }
    if (k === 'username' && v.match(uReg)) {
      errors[k] = `Please enter a valid username`
    }
    if (k === 'email' &&
      (v.indexOf('@') === -1 || v.indexOf('.') === -1 || v.match(eReg))) {
      errors[k] = `Please enter a valid email address`
    }
    data[k] = v.toLowerCase()
  })
  return {
    data: data,
    errors: errors
  }
}

// checks if object is empty
function isEmpty (obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object
}



export default SignUpModal
