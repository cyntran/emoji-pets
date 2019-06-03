import React, { Component } from "react"
import PropTypes from "prop-types"


class PetForm extends Component {
  constructor (props) {
    super (props)
    this.state = {
      item: this.props.item,
      name: this.props.name,
      errors: false,
      charLimit: 0,
      onClose: this.props.handleModal,
      showPurchasingDiv: false
    }
    this.handleBioInput = this.handleBioInput.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    console.log('this.state.name', this.state.name)
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

    let newPostData = Object.assign({}, postData, {
      path: this.state.item.path,
      unicode: this.state.item.unicode,
      prevOwner: this.state.item.prevOwner,
      isAnimal: this.state.item.isAnimal
    })
    console.log('newPostData', newPostData)

    let errorData = data.error

    this.setState({
      error: errorData
    })

    if (!isEmpty(errorData)) {
      console.log(errorData)
      return
    }
    this.setState({
      showPurchasingDiv: true,
    })

    setTimeout(() => window.location.reload(), 1000)

    buy(newPostData, this.state.name)
  }

  render () {
    return (
      <div className='pet-form-container'>
        <h1 id='pet-form-title'>Adoption Form</h1>
        {this.state.showPurchasingDiv && <div id='purchasing-div-new-item'>Purchasing! Please wait...</div>}
        <form onSubmit={this.handleSubmit}>
          <label className='pet-form-labels'>Pet Name:
            {this.state.errors && <p className='error-msg' id='pet-name-err'>{this.state.errors.name}</p>}
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


async function buy (info, stateName) {
  fetch('http://localhost:8080/item/buy', {
    method: 'POST',
    body: JSON.stringify({
      name: (!info.name) ? stateName : info.name,
      info: info
    }),
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  })
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
        data.name = v
      }
    }
    if (k === 'bio') {
      if (!v) {
        data.bio = 'My pet is the sweetest.'
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

export default PetForm
