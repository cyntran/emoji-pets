import React, { Component } from "react"
import PropTypes from "prop-types"
import config from "../../../clientConfig.js"


class SignInModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      isHidden: false,
      errors: false,
      signin: false
    }
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleSubmit (e) {
    e.preventDefault()
    if (e.type == 'submit') {
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

      fetch(`${config.apiUrl}/login`, {
        method: 'POST',
        body: JSON.stringify(postData),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
      })
      .then(response => {
        if (response.ok) {
          window.location.reload()
          return
        } else {
          this.setState({
            signIn: 'Oops -- wrong credentials.'
          })
        }
       })
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
      <div className='modal' id='sign-in-modal'>
        <h1 className='acc-h1'>Sign in!</h1>
        {this.state.signIn && <p className='error-msg error-msg-credentials'>{this.state.signIn}</p>}<br />
        <form onSubmit={this.handleSubmit} className='sign-in' >

          <label>Email Address:
            {this.state.errors.email && <p className='error-msg' id='error-msg-email'>{this.state.errors.email}</p>}
            <br/ ><input type='text' name='email' data-parse='lowercase'/>
          </label><br />

          <label>Password:
            {this.state.errors.password && <p className='error-msg' id='error-msg-pw'>{this.state.errors.password}</p>}
            <br /><input type='password' name='password' data-parse='lowercase'/>
          </label>

          <input type='submit' id='enter-modal-btn' value='Submit!'/>
          <button id='close-modal-btn' onClick={this.toggleHidden.bind(this)}>Close</button>
        </form>
      </div>
    )
  }
}

// helper function
function parseInput (parseData) {
  let data  = {}
  let errors = {}
  parseData.forEach((v, k) => {
    if (!v) {
      errors[k] = `Please enter your ${k}.`
    }
    if (k === 'email' && v && (v.indexOf('@') === -1 || v.indexOf('.') === -1)) {
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


export default SignInModal
