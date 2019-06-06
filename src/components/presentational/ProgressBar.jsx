import React, { Component } from "react"


class ProgressBar extends Component {
  constructor (props) {
    super(props)
    this.state = {
      now: this.props.now.toString() + '%',
    }
  }

  render() {
    return(
      <div className='progress-bar' style={{ display: 'inline-block' }}>
        <div style={{width: this.state.now}}></div>
      </div>
    )
  }
}


export default ProgressBar
