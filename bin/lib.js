#!/usr/bin/env node
/* eslint no-unused-expressions: 0, func-names: 0 */

const fs = require('fs')
const yargs = require('yargs')

const ROOT_PATH = fs.realpathSync(process.cwd())
const DEFAULT_CONFIG_FILE = `${ROOT_PATH}/lib.config.js`
const DEFAULT_TSCONFIG = `${ROOT_PATH}/tsconfig.json`

yargs
  .usage('$0 <cmd> [args]')
  .command({
    command: 'build [args]',
    builder: ({ positional }) => {
      positional('config', {
        alias: ['c', 'cfg'],
        default: DEFAULT_CONFIG_FILE,
      })
      positional('extensions', {
        alias: 'ext',
        default: ['.js', '.jsx'],
      })
      positional('tsconfig', {
        default: DEFAULT_TSCONFIG,
      })
      positional('gzip', {
        default: false,
      })
      positional('production', {
        alias: 'p',
        default: false,
      })
      positional('watch', {
        alias: 'w',
        default: false,
      })
    },
    handler: () => {
      require('../scripts/build')
    }
  })
  .help()
  .argv
