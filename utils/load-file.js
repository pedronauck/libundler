const loadFile = (filepath) => {
  let file

  try {
    file = require(filepath)
  } catch (err) {
    console.log(err)
    file = null
  }

  return file
}

module.exports = loadFile
