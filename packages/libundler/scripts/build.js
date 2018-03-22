/* eslint camelcase: 0, no-unreachable: 0 */
const fs = require('fs')
const path = require('path')
const Promise = require('bluebird')
const bluebirdCo = require('bluebird-co')
const c = require('chalk')
const micromatch = require('micromatch')
const async = require('neo-async')
const emoji = require('node-emoji')
const logUpdate = require('log-update')
const findup = require('find-up')
const merge = require('deepmerge')
const { argv } = require('yargs')
const { rm, exit, test, ls } = require('shelljs')
const { rollup, watch } = require('rollup')
const babel = require('rollup-plugin-babel')
const commonjs = require('rollup-plugin-commonjs')
const gzip = require('rollup-plugin-gzip')
const nodeResolve = require('rollup-plugin-node-resolve')
const sourceMaps = require('rollup-plugin-sourcemaps')
const replace = require('rollup-plugin-replace')
const uglify = require('rollup-plugin-uglify')
const typescript = require('rollup-plugin-typescript2')
const { minify } = require('uglify-es')

const log = require('../utils/log')
const loadFile = require('../utils/load-file')
const invariant = require('../utils/invariant')
const filenameReplace = require('../utils/filename-replace')
const getPkgJson = require('../utils/get-pkg-json')

Promise.coroutine.addYieldHandler(bluebirdCo.toPromise)

const ENV = process.env.NODE_ENV
const ROOT_PATH = fs.realpathSync(process.cwd())
const PKG_JSON = getPkgJson(ROOT_PATH)

const CONFIG = loadFile(argv.config)
const CONTEXT = CONFIG.context || ROOT_PATH
const EXTENSIONS = CONFIG.extensions || argv.extensions
const DEFAULT_EXCLUDE = CONFIG.exclude || []

const DEST = argv.dest
const TARGET = argv.target
const SOURCEMAP = argv.sourcemap
const IS_PROD = argv.compress || ENV === 'production'

const EXTS_GLOB = `**/*.{${EXTENSIONS.join(',').replace(/\./gm, '')}}`
const HAS_TS = EXTENSIONS.some(e => /.(ts|tsx)$/.test(e))

const FORMATS = {
  cjs: {
    filename: `[name].${argv.hash ? '[hash].' : ''}js`,
    format: 'cjs',
    sourcemap: SOURCEMAP,
  },
  es: {
    filename: `[name].${argv.hash ? '[hash].' : ''}m.js`,
    format: 'es',
    sourcemap: SOURCEMAP,
  },
  umd: {
    filename: `[name].${argv.hash ? '[hash].' : ''}umd.js`,
    format: 'cjs',
    sourcemap: SOURCEMAP,
  },
}

const resolveWithCtx = p => path.resolve(CONTEXT, p)
const filterSelectedExts = filepath => micromatch.isMatch(filepath, EXTS_GLOB)
const filterExclude = filepath => !micromatch.any(filepath, DEFAULT_EXCLUDE)

const getEntries = () => {
  const entries = PKG_JSON.source || argv.source || [EXTS_GLOB]
  const arr = Array.isArray(entries) ? entries : [entries]

  return ls(arr.map(resolveWithCtx))
    .filter(filterExclude)
    .filter(filterSelectedExts)
}

const getBabelRc = () => {
  let babelrc

  try {
    babelrc = JSON.parse(fs.readFileSync(findup.sync('.babelrc')))
  } catch (err) {
    babelrc = null
  }

  return babelrc
}

const BABELRC = getBabelRc()
const ENTRIES = getEntries()
const OUTPUT = argv.formats.map(format => FORMATS[format])

const plugins = [
  replace({
    'process.env.NODE_ENV': JSON.stringify(ENV),
  }),
  HAS_TS &&
    typescript({
      typescript: require('typescript'),
      tsconfigDefaults: {
        compilerOptions: {
          declaration: true,
        },
      },
    }),
  BABELRC &&
    babel(
      merge(BABELRC, {
        exclude: 'node_modules/**',
        plugins: ['@babel/plugin-external-helpers'],
        externalHelpers: true,
      })
    ),
  nodeResolve({
    jsnext: true,
    module: true,
    main: true,
    preferBuiltins: true,
    browser: TARGET !== 'node',
  }),
  commonjs({
    include: 'node_modules/**',
  }),
  SOURCEMAP && sourceMaps(),
  IS_PROD &&
    uglify(
      {
        warnings: true,
        ecma: 5,
        output: {
          comments: false,
        },
        compress: {
          pure_getters: true,
          unsafe: true,
          unsafe_comps: true,
          warnings: false,
        },
      },
      minify
    ),
  IS_PROD && gzip(),
]

const external = ['dns', 'fs', 'path', 'url'].concat(
  Object.keys(PKG_JSON.peerDependencies || {}),
  CONFIG.external || []
)

let warningList = {}

const getInputOpts = input => ({
  input,
  plugins,
  external,
  onwarn(warning) {
    warningList[input] = warning
  },
})

const getOutputOpts = (
  input,
  { name, filename, format = 'cjs', sourcemap = false }
) => {
  invariant(
    format === 'umd' && !name,
    `Please set a ${c.bold('name')} if your bundle has a ${c.bold(
      'UMD'
    )} format`
  )

  const globals = CONFIG.globals || {}
  const file = path.join(DEST, filenameReplace(CONTEXT, input, filename))

  return {
    name,
    format,
    sourcemap,
    file,
    globals,
    exports: 'named',
  }
}

const clean = done => {
  const dest = path.resolve(ROOT_PATH, DEST)

  logUpdate(`${emoji.get(':recycle:')}  Cleaning old files...`)
  test('-d', dest) && rm('-rf', dest)
  logUpdate.done()
  done()
}

const buildEntry = Promise.coroutine(function*(input) {
  const relative = path.relative(ROOT_PATH, input)

  for (const output of OUTPUT) {
    const compiling = log.compiling(relative)
    const inputOpts = getInputOpts(input)
    const outputOpts = getOutputOpts(input, output)

    try {
      const bundle = yield rollup(inputOpts)
      yield bundle.write(outputOpts)
      log.success({
        input,
        output,
        ctx: CONTEXT,
        dest: DEST,
        warning: warningList[input],
      })
    } catch (err) {
      console.log(c.red(err))
      exit(1)
    }

    clearInterval(compiling)
  }
})

const watchOpts = input => ({
  ...getInputOpts(input),
  output: OUTPUT.map(output => getOutputOpts(input, output)),
  watch: {
    exclude: 'node_modules/**',
  },
})

const watchLib = done => {
  const opts = ENTRIES.map(watchOpts)
  const watcher = watch(opts)

  watcher.on('event', log.watch(CONTEXT))
  done()
}

const buildLib = done => {
  logUpdate(`${emoji.get(':rocket:')}  Start compiling...`)

  for (const entry of ENTRIES) buildEntry(entry)
  logUpdate.done()
  done()
}

module.exports = (watch = false) =>
  async.series([clean, watch ? watchLib : buildLib])
