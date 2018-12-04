import React, { Fragment } from 'react'
import { render } from 'react-dom'

const add = import('./add')

const App = () => (
  <Fragment>
    <h1>Sample app</h1>
    <div>Hello world {add(1, 2)}</div>
  </Fragment>
)

render(<App />, document.querySelector('#root'))
