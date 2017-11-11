#!/usr/bin/env node
/* eslint no-unused-expressions: 0, func-names: 0 */

const fs = require('fs')
const yargs = require('yargs')

const ROOT_PATH = fs.realpathSync(process.cwd())
const DEFAULT_CONFIG_FILE = `${ROOT_PATH}/lib.config.js`
const DEFAULT_TSCONFIG = `${ROOT_PATH}/tsconfig.json`

const args = {
  'config': {
    alias: 'c',
    default: DEFAULT_CONFIG_FILE,
  },
  'extensions': {
    alias: 'ex',
    default: ['.js', '.jsx'],
  },
  'tsconfig': {
    default: DEFAULT_TSCONFIG,
  },
  'gzip': {
    default: false,
  },
  'production': {
    alias: 'p',
    default: false,
  },
  'watch': {
    alias: 'w',
    default: false,
  },
}

yargs
  .usage('$0 <cmd> [args]')
  .command('build', 'build your library', args, () => {
    require('../scripts/build')
  })
  .help()
  .argv
