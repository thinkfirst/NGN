import path from 'path'
import fs from 'fs'
import config from './config.js'
import NgnPlugin from './rollup-plugin-ngn.js'
import babel from 'rollup-plugin-babel'

// Install source map support
import { install } from 'source-map-support'
install()

// Identify source file
const input = path.resolve('../src/main.js')

// Add NGN rollup support
const ngn = new NgnPlugin()

// Configure metadata for the build process.
const rootdir = path.join(config.testOutput, '.node') // Main output directory
let outdir = rootdir // Active output directory
let configuration = [] // Rollup Configurations
let output = `${outdir}/index.js`

// Pre-process: Check if the build actually needs to be updated.
// a. Check the timestamp of the last build file and determine if it is outdated.
const lastbuildtime = fs.statSync(output).mtime.getTime()

// b. Check all source files for last modification dates
const updatedfiles = ngn.walk(path.dirname(input)).some(filepath => {
  if (fs.statSync(filepath).mtime.getTime() > lastbuildtime) {
    return true
  }
})

if (!updatedfiles) {
  console.log('Build is unnecessary (no changes since last build).')
  process.exit(0)
}

// 1. Clean prior builds
fs.rmdirSync(rootdir, { recursive: true })

// Identify plugins
const plugins = [
  ngn.only('node'),
  ngn.applyVersion(ngn.version),
  babel({
    plugins: [['@babel/plugin-proposal-class-properties', { 'loose': false }]],
    externalHelpersWhitelist: ['classPrivateFieldSet', 'classPrivateFieldGet']
  })
]

// 2. Build Node Production Package: Standard (Minified/Munged)
configuration.push({
  input,
  plugins,
  output: {
    file: output,
    format: 'esm',
    sourcemap: true,
    name: 'NGN'
  },
  external: config.external
})

export default configuration
