const fs = require('fs')
const invariant = require('invariant')
const path = require('path')
const { exit } = require('shelljs')

const getPkgJson = rootPath => {
  let pkg

  try {
    pkg = JSON.parse(
      fs.readFileSync(path.resolve(rootPath, 'package.json'), 'utf-8')
    )
  } catch (err) {
    invariant(
      true,
      `no package.json found. Assuming a pkg.name of "${path.basename(
        rootPath
      )}".`
    )
    exit(1)
  }

  return pkg
}

module.exports = getPkgJson
