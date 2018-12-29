#!/usr/bin/env node
/* eslint no-unused-expressions: 0 */

const fs = require('fs')
const yargs = require('yargs')

const defineArgs = yargs =>
  yargs
    .option('source', {
      alias: 'src',
    })
    .option('dest', {
      alias: 'd',
      default: 'dist',
    })
    .option('exclude', {
      default: [],
      array: true,
    })
    .option('external', {
      alias: 'e',
    })
    .option('target', {
      default: 'node',
    })
    .option('formats', {
      alias: 'f',
      default: ['cjs', 'esm'],
      array: true,
    })
    .option('typescript', {
      alias: 'ts',
      default: false,
    })
    .option('useBabel', {
      default: true,
    })
    .option('cwd', {
      default: fs.realpathSync(process.cwd()),
    })
    .option('compress', {
      alias: 'c',
      default: false,
    })
    .option('hash', {
      default: false,
    })
    .option('sourcemap', {
      alias: 'sm',
      default: false,
    })

yargs
  .usage('$0 <cmd> [args]')
  .command('build [opts]', 'Build once and exit', defineArgs, () => {
    require('../scripts/build')()
  })
  .command('watch [opts]', 'Rebuilds on any change', defineArgs, () => {
    require('../scripts/build')(true)
  })
  .demandCommand()
  .help()
  .wrap(72)
  .epilog('for more information visit https://github.com/pedronauck/libundler')
  .showHelpOnFail(false, 'whoops, something went wrong! run with --help').argv
