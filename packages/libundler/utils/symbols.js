const figures = require('figures')
const c = require('chalk')

exports.arrow = figures('›')
exports.warning = c.yellow(figures('⚠'))
exports.success = c.green(figures('✔'))
exports.error = c.red(figures('✖'))
