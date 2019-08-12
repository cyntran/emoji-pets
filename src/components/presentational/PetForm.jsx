import React, { Component } from "react"
import PropTypes from "prop-types"
import config from "../../../clientConfig.js"
import { withRouter } from 'react-router-dom'

class PetForm extends Component {
  constructor (props) {
    super (props)
    this.state = {
      item: this.props.item,
      name: this.props.name,
      errors: false,
      charLimit: 0,
      onClose: this.props.handleModal,
      showPurchasingDiv: false,
      errorMsg: false
    }
    this.handleBioInput = this.handleBioInput.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  nextPath (path) {
    this.props.history.push(path)
  }

  handleBioInput (e) {
    this.setState({
      charLimit: e.target.value.length
    })
  }


  handleSubmit (e) {
    e.preventDefault()

    let parseData = new FormData(e.target)
    let data = parseInput(parseData)
    let postData = data.data
    this.state.item.petData.bio = postData.bio
    let itemData = this.state.item

    if (!isEmpty(data.error)) {
      this.setState({
        errors: data.error
      })
    } else {
      this.setState({
        showPurchasingDiv: true,
      })

      let buyData = { name: postData.name, bio: postData.bio }

      fetch(`${config.apiUrl}/item/buy`, {
        method: 'POST',
        body: JSON.stringify({
          buyData: buyData,
          item: itemData
        }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(res => {
        if (!res.ok) {
          this.setState({ errorMsg: true, showPurchasingDiv: false})
          setTimeout(() => window.location.reload(), 2000)
          return
        }
        return res.json()
      })
      .then((userInfo) => {
        setTimeout(() => this.nextPath(`/pet/${userInfo.username}/${buyData.name}`), 1000)
      })
    }
  }

  render () {
    return (
      <div className='pet-form-container'>
        <h1 id='pet-form-title'>Adoption Form</h1>
        { this.state.errorMsg && <div id='login-buy'> Sorry, you do not have enough funds. </div> }

        {this.state.showPurchasingDiv && <div id='purchasing-div'>Purchasing! Please wait...</div>}
        <form onSubmit={this.handleSubmit}>
          <label className='pet-form-labels'>Pet Name:
            { this.state.errors && <p className='error-msg' id='pet-name-err'>{this.state.errors}</p> }
            <br/ ><input id='pet-name-input' type='text' name='name' maxLength="20"/>
          </label><br />

          <label className='pet-form-labels'>Bio (optional):
            <br/ ><textarea id='animal-bio' name='bio' maxLength="300" onChange={this.handleBioInput}/>
            <p id='adopt-text-limit'>character limit: ({this.state.charLimit}/300)</p>
          </label><br />

          <button id='adopt-form-btn' type='submit'>adopt!</button>
          <button id='close-adopt-form' onClick={() => this.state.onClose(true)}>close</button>
        </form>
      </div>
    )
  }
}


// helper functions below
function parseInput (parseData) {
  let data  = {}
  let error = {}
  parseData.forEach((v, k) => {
    if (k === 'name') {
      if (!v) {
        error = `*Required: Please enter your pet's name.`
      } else {
        if (v.includes(' ')) {
          error = `*Please enter a valid name.`
        }
        data.name = v
      }
    }
    if (k === 'bio') {
      if (!v) {
        data.bio = 'My pet is the cutest!'
      } else {
        data.bio = v
      }
    }
  })
  return {
    data: data,
    error: error
  }
}

// checks if object is empty
function isEmpty (obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object
}

export default withRouter(PetForm)
