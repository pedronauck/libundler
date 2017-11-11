const loadFile = (filepath) => {
  let file

  try {
    file = require(filepath)
  } catch (err) {
    file = null
  }

  return file
}

module.exports = loadFile
