/* eslint camelcase: 0, no-unreachable: 0 */
const path = require('path')
const Promise = require('bluebird')
const bluebirdCo = require('bluebird-co')
const c = require('chalk')
const micromatch = require('micromatch')
const async = require('neo-async')
const emoji = require('node-emoji')
const logUpdate = require('log-update')
const merge = require('deepmerge')
const { argv } = require('yargs')
const { rm, exit, test, ls } = require('shelljs')
const { rollup, watch } = require('rollup')
const babel = require('rollup-plugin-babel')
const commonjs = require('rollup-plugin-commonjs')
const peerDepsExternal = require('rollup-plugin-peer-deps-external')
const gzip = require('rollup-plugin-gzip').default
const nodeResolve = require('rollup-plugin-node-resolve')
const sourceMaps = require('rollup-plugin-sourcemaps')
const typescript = require('rollup-plugin-typescript2')
const { terser } = require('rollup-plugin-terser')
const json = require('rollup-plugin-json')
const externals = require('@yelo/rollup-node-external')
const PrettyError = require('pretty-error')

const log = require('../utils/log')
const load = require('../utils/load-config-file')

Promise.coroutine.addYieldHandler(bluebirdCo.toPromise)

const pe = new PrettyError()

const ENV = process.env.NODE_ENV
const PKG_JSON = load('package', null)
const BABELRC = load('babel', null)
const CONFIG = load('lib', {
  dest: argv.dest,
  exclude: argv.exclude,
  formats: argv.formats,
  external: argv.external,
  target: argv.target,
  cwd: argv.cwd,
  typescript: argv.typescript,
  sourcemap: argv.sourcemap,
  compress: argv.compress || ENV === 'production',
  useBabel: argv.useBabel,
  hash: argv.hash,
  plugins: [],
  commonjs: {},
  typescriptOpts: {},
  babelOpts: {},
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
})

if (!PKG_JSON) {
  process.stderr.write(
    c.yellow(
      `${c.yellow.inverse(
        'WARN'
      )} no package.json found. Assuming a pkg.name of "${path.basename(
        argv.cwd
      )}".`
    ) + '\n'
  )
  exit(1)
}

const DEST = CONFIG.dest
const EXCLUDE = CONFIG.exclude
const CONTEXT = CONFIG.cwd
const FORMATS = CONFIG.formats
const TARGET = CONFIG.target
const SOURCEMAP = CONFIG.sourcemap
const EXTERNAL = CONFIG.external
const IS_PROD = CONFIG.compress
const WITH_HASH = CONFIG.hash
const HAS_TS = CONFIG.typescript
const RESOLVE = CONFIG.resolve
const USE_BABEL = CONFIG.useBabel
const TS_OPTS = CONFIG.typescriptOpts
const BABEL_OPTS = CONFIG.babelOpts

const resolveWithCtx = p => path.resolve(CONTEXT, p)
const filterExclude = filepath => !micromatch.any(filepath, EXCLUDE)

const getEntries = () => {
  const entries = PKG_JSON.source || argv.source
  const arr = Array.isArray(entries) ? entries : [entries]

  return ls(arr.map(resolveWithCtx)).filter(filterExclude)
}

const getExternal = () => {
  const peerDeps = Object.keys(PKG_JSON.peerDependencies || {})
  const external = ['dns', 'fs', 'path', 'url'].concat(peerDeps)

  if (EXTERNAL && EXTERNAL === 'all') {
    return externals()
  }

  if (EXTERNAL && Array.isArray(EXTERNAL)) {
    return external.concat(EXTERNAL)
  }

  return external
}

const entries = getEntries()
const useNodeResolve = EXTERNAL !== 'all'

const defaultPlugins = [
  peerDepsExternal(),
  json(),
  HAS_TS &&
    typescript({
      tsconfigDefaults: merge(
        {
          compilerOptions: {
            declaration: true,
          },
        },
        TS_OPTS
      ),
    }),
  Boolean(BABELRC) &&
    USE_BABEL &&
    babel(
      merge(BABELRC, BABEL_OPTS, {
        exclude: 'node_modules/**',
      })
    ),
  useNodeResolve &&
    nodeResolve({
      jsnext: true,
      module: true,
      main: true,
      preferBuiltins: true,
      browser: TARGET !== 'node',
      extensions: RESOLVE.extensions,
    }),
  useNodeResolve &&
    commonjs(
      merge({}, CONFIG.commonjs, {
        include: 'node_modules/**',
      })
    ),
  SOURCEMAP && sourceMaps(),
  IS_PROD &&
    terser({
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
    }),
  IS_PROD && gzip(),
].filter(f => f)

const FORMATS_MAP = {
  cjs: {
    chunkFileNames: `[name].[hash].js`,
    entryFileNames: `[name].${WITH_HASH ? '[hash].' : ''}js`,
    format: 'cjs',
    sourcemap: SOURCEMAP,
  },
  esm: {
    chunkFileNames: `[name].[hash].[format].js`,
    entryFileNames: `[name].${WITH_HASH ? '[hash].' : ''}[format].js`,
    format: 'esm',
    sourcemap: SOURCEMAP,
  },
}

const outputs = FORMATS.map(format => FORMATS_MAP[format])
const plugins =
  CONFIG.plugins && typeof CONFIG.plugins === 'function'
    ? CONFIG.plugins(defaultPlugins)
    : CONFIG.plugins.concat(defaultPlugins)

let warningList = {}
const external = getExternal()
const getInputOpts = input => ({
  input,
  plugins,
  external,
  onwarn(warning) {
    warningList[input] = warning
  },
})

const clean = done => {
  const dest = path.resolve(CONTEXT, DEST)

  logUpdate(`${emoji.get(':recycle:')}  Cleaning old files...`)
  test('-d', dest) && rm('-rf', dest)
  logUpdate.done()
  done()
}

const buildEntry = Promise.coroutine(function*(input) {
  for (const output of outputs) {
    const inputOpts = getInputOpts(input)

    try {
      const bundle = yield rollup(inputOpts)
      yield bundle.write({ ...output, dir: DEST })
    } catch (err) {
      console.log(pe.render(err))
      exit(1)
    }
  }

  log.success({
    input,
    dest: DEST,
    output: outputs[0],
    warning: warningList[input],
  })
})

const watchOpts = input => ({
  ...getInputOpts(input),
  output: outputs.map(output => ({ ...output, dir: DEST })),
  watch: {
    exclude: 'node_modules/**',
  },
})

const watchLib = done => {
  const opts = entries.map(watchOpts)
  const watcher = watch(opts)

  watcher.on('event', log.watch(CONTEXT))
  done()
}

const buildLib = done => {
  logUpdate(`${emoji.get(':rocket:')} Start compiling...`)

  for (const entry of entries) buildEntry(entry)
  logUpdate.done()
  done()
}

module.exports = (watch = false) =>
  async.series([clean, watch ? watchLib : buildLib])
