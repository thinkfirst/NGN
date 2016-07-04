'use strict'

const path = require('path')
const fs = require('fs')
const gulp = require('gulp')
const stripper = require('gulp-strip-comments')
// const concat = require('gulp-concat')
const header = require('gulp-header')
const del = require('del')
const cp = require('child_process')
const pkg = require('./package.json')

let headerComment = '/**\n  * v' + pkg.version + ' generated on: ' +
  (new Date()) + '\n  * Copyright (c) 2014-' + (new Date()).getFullYear() +
  ', Ecor Ventures LLC. All Rights Reserved. See LICENSE (BSD3).\n  */\n'

const DIR = {
  source: path.resolve('./'),
  shared: path.resolve('./shared'),
  dist: path.resolve('./dist')
}

const walk = function (dir) {
  let files = []
  fs.readdirSync(dir).forEach(function (filepath) {
    filepath = path.join(dir, filepath)
    const stat = fs.statSync(filepath)
    if (stat.isDirectory()) {
      files = files.concat(walk(filepath))
    } else {
      files.push(filepath)
    }
  })
  return files
}

const clean = function () {
  try {
    fs.accessSync(DIR.dist, fs.F_OK)
    del.sync(DIR.dist)
  } catch (e) {}
}

gulp.task('clear', function () {
  clean()
})

// Create a clean build
gulp.task('clean', function (next) {
  console.log('Cleaning distribution.')
  clean()
  fs.mkdirSync(DIR.dist)
  next()
})

gulp.task('generate', function () {
  // Primary codebase
  const primary = walk(path.join(DIR.source, 'lib'))
  let primaryjs = []
  let primaryother = []

  primary.forEach(function (file) {
    if (/[^.*\.js]$/gi.test(file)) {
      primaryother.push(file)
    } else {
      primaryjs.push(file)
    }
  })

  gulp.src(primaryjs)
    .pipe(stripper())
    .pipe(header(headerComment))
    .pipe(gulp.dest(path.join(DIR.dist, 'lib')))

  gulp.src(primaryother)
    .pipe(header(headerComment))
    .pipe(gulp.dest(path.join(DIR.dist, 'lib')))

  // Shared codebase
  const primaryshared = walk(DIR.shared)
  let primarysharedjs = []
  let primarysharedother = []

  primaryshared.forEach(function (file) {
    if (/[^.*\.js]$/gi.test(file)) {
      primarysharedother.push(file)
    } else {
      primarysharedjs.push(file)
    }
  })

  gulp.src(primarysharedjs)
    .pipe(stripper())
    .pipe(header(headerComment))
    .pipe(gulp.dest(path.join(DIR.dist, 'shared')))

  gulp.src(primarysharedother)
    .pipe(header(headerComment))
    .pipe(gulp.dest(path.join(DIR.dist, 'shared')))

  // Primary Files
  const files = ['NGN.js'].map(function (file) {
    return path.join(DIR.source, file)
  }).filter(function (file) {
    try {
      fs.accessSync(file, fs.F_OK)
      return true
    } catch (e) {
      return false
    }
  })

  let filesjs = []
  let filesother = []

  files.forEach(function (file) {
    if (/[^.*\.js]$/gi.test(file)) {
      filesother.push(file)
    } else {
      filesjs.push(file)
    }
  })

  gulp.src(filesjs)
    .pipe(stripper())
    .pipe(header(headerComment))
    .pipe(gulp.dest(DIR.dist))

  gulp.src(filesother)
    .pipe(header(headerComment))
    .pipe(gulp.dest(DIR.dist))

  // Copy other files
  const assets = ['LICENSE', '.npmignore'].map(function (file) {
    return path.join(DIR.source, file)
  })

  gulp.src(assets)
    .pipe(gulp.dest(DIR.dist))

  // Update package.json for production release
  let newpkg = {}
  const pkgitems = [
    'name',
    'version',
    'description',
    'main',
    'repository',
    'keywords',
    'preferGlobal',
    'engines',
    'author',
    'contributors',
    'homepage',
    'license',
    'dependencies'
  ]

  Object.keys(pkg).forEach(function (attr) {
    if (pkgitems.indexOf(attr) >= 0) {
      newpkg[attr] = pkg[attr]
    }
  })

  fs.writeFileSync(path.join(DIR.dist, 'package.json'), JSON.stringify(newpkg, null, 2))
})

gulp.task('prereleasecheck', function (next) {
  console.log('Checking if package already exists.')
  const child = cp.spawn('npm', ['info', pkg.name])

  let data = ''
  process.env.DEPLOY_ME = false
  child.stdout.on('data', function (chunk) {
    data += chunk.toString()
  })
  child.on('close', function () {
    const re = new RegExp('latest: \'' + pkg.version + '\'')
    if (re.exec(data) === null) {
      next()
    } else {
      process.env.DEPLOY_ME = true
      console.log('The version has not changed (' + pkg.version + '). A new release is unnecessary. Aborting deployment with success code.')
      process.exit(0)
    }
  })
})

gulp.task('build', ['clean', 'generate'])
