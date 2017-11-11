const hash = require('hasha')
const path = require('path')

const filenameReplace = (root, input, filename) => {
  const parsed = path.parse(input)
  const dir = path.relative(root, parsed.dir)

  const fullpath = path.join(dir, parsed.name)

  return filename
    .replace(/\[dir\]/m, dir)
    .replace(/\[name\]/m, parsed.name)
    .replace(/\[ext\]/m, parsed.ext)
    .replace(/\[hash\]/m, hash(fullpath, { algorithm: 'md5' }))
}

module.exports = filenameReplace
