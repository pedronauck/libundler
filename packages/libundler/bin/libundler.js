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
    description: 'Allowed extenstions to parse',
  })
  yargs.positional('formats', {
    alias: 'f',
    default: ['umd', 'cjs', 'es'],
  })
  yargs.positional('jsx', {
    default: 'h',
  })
  yargs.positional('hash', {
    default: false,
    description: 'Add a hash md5 on your build files',
  })
  yargs.positional('gzip', {
    default: false,
  })
  yargs.positional('sourcemap', {
    alias: 's',
    default: false,
  })
  yargs.positional('production', {
    alias: 'p',
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
