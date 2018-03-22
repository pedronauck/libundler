const loadFile = filepath => {
  let file

  try {
    file = require(filepath)
  } catch (err) {
    file = {}
  }

  return file
}

module.exports = loadFile
