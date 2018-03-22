#!/usr/bin/env node
/* eslint no-unused-expressions: 0 */

const yargs = require('yargs')

const defineArgs = yargs => {
  yargs.positional('source', {
    alias: 'src',
  })
  yargs.positional('dest', {
    alias: 'd',
    default: 'dist',
  })
  yargs.positional('extensions', {
    alias: ['e', 'exts'],
    default: ['.js', '.jsx'],
  })
  yargs.positional('formats', {
    alias: 'f',
    default: ['umd', 'cjs', 'es'],
  })
  yargs.positional('target', {
    default: 'node',
  })
  yargs.positional('compress', {
    default: false,
  })
  yargs.positional('sourcemap', {
    default: false,
  })
}

yargs
  .usage('$0 <cmd> [args]')
  .command('build', 'Build once and exit', defineArgs, () => {
    require('../scripts/build')()
  })
  .command('watch', 'Rebuilds on any change', defineArgs, () => {
    require('../scripts/build')(true)
  })
  .demandCommand()
  .help()
  .wrap(72)
  .epilog('for more information visit https://github.com/pedronauck/libundler')
  .showHelpOnFail(false, 'whoops, something went wrong! run with --help').argv
