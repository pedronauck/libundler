import * as React from 'react'
import { render } from 'react-dom'

const App = () => (
  <React.Fragment>
    <h1>Sample app</h1>
    <div>Hello world</div>
  </React.Fragment>
)

render(<App />, document.querySelector('#root'))
