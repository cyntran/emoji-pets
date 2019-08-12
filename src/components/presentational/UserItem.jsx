import React, { Component } from "react"
import ReactDOM from "react-dom"
import ItemModal from "../presentational/ItemModal.jsx"

class UserItem extends Component {
  constructor (props) {
    super (props)
    this.state = {
      isHidden: true,
      item: this.props.item,
      user: this.props.user
    }
  }

  componentDidMount () {
    window.addEventListener('scroll', this.handleScroll)
    let scrollPs = localStorage.getItem('scrollY')
    if (scrollPs) {
      setTimeout(() => window.scrollTo(0, scrollPs), 200)
    }
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll)
  }

  handleScroll () {
    let winScroll = document.body.scrollTop || document.documentElement.scrollTop
    let height = document.documentElement.scrollHeight - document.documentElement.clientHeight
    window.localStorage.setItem('scrollY', winScroll)
  }

  checkHidden = (data) => {
    this.setState({ isHidden: data})
  }

  toggleHidden () {
    this.setState({
      isHidden: !this.state.isHidden
    })
  }

  render () {
    return (
      <div className='items not-animal'>
        { !this.state.isHidden && <ItemModal handleModal={this.checkHidden} user={this.state.user} item={this.state.item} /> }
        <img src={this.state.item.path} id='item' />
        <p id='item-category'>Category: {this.state.item.category}</p>
        <button className='open-item-btn' onClick={this.toggleHidden.bind(this)}>options</button>
      </div>
    )
  }
}

export default UserItem
