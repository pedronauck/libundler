const fs = require('fs')
const path = require('path')
const findup = require('find-up')
const merge = require('deepmerge')

const finds = name => [
  `${name}.json`,
  `.${name}rc`,
  `${name}rc.js`,
  `${name}rc.json`,
  `${name}rc.yml`,
  `${name}rc.yaml`,
  `${name}.config.js`,
  `${name}.config.json`,
]

const loadConfigFile = (name, defaultConfig = {}) => {
  let file

  try {
    const filepath = findup.sync(finds(name))
    const isJS = path.extname(filepath) === '.js'

    file = isJS
      ? require(filepath)
      : JSON.parse(fs.readFileSync(filepath, 'utf-8'))
  } catch (err) {
    // console.log(err)
    file = defaultConfig
  }

  return defaultConfig !== null ? merge(defaultConfig, file) : file
}

module.exports = loadConfigFile
