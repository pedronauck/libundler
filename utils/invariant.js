const c = require('chalk')
const { exit } = require('shelljs')

const symbols = require('./symbols')

const invariant = (test, message) => {
  if (test) {
    console.error(c.red(`${symbols.error} [ERROR] ${message}`))
    exit(1)
  }
}

module.exports = invariant
