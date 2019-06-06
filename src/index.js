import React from 'react'
import ReactDOM from 'react-dom'
import { Route, Link, BrowserRouter as Router } from 'react-router-dom'
import MainContainer from "./components/container/MainContainer.jsx"
import MarketPlace from "./components/presentational/MarketPlace.jsx"
import Profile from "./components/presentational/Profile.jsx"
import PetProfile from "./components/presentational/PetProfile.jsx"

const routing = (
  <Router>
    <div>
    <Route exact={true} path="/" component={ MainContainer } />
    <Route path="/forsale" component={ MarketPlace } />
    <Route path="/profile/:username" component={ Profile } />
    <Route path="/pet/:username/:petname" component={ PetProfile } />
    </div>
  </Router>
)

ReactDOM.render(routing, document.getElementById("emoji-app"))
