const fs = require('fs')
const findup = require('find-up')

const getPkgJson = () => {
  let pkg

  try {
    pkg = JSON.parse(fs.readFileSync(findup.sync('package.json')))
  } catch (err) {
    pkg = null
  }

  return pkg
}

module.exports = getPkgJson
