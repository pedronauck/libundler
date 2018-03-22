import React, { Fragment } from 'react'
import { render } from 'react-dom'

const App = () => (
  <Fragment>
    <h1>Sample app</h1>
    <div>Hello world</div>
  </Fragment>
)

render(<App />, document.querySelector('#root'))
