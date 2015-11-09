'use strict'

var test = require('tape')

test('Primary Namespace', function (t) {
  require('../')
  t.ok(NGN !== undefined, 'NGN is defined globally.')
  t.ok(ngn !== undefined, 'ngn is defined globally.')
  t.ok(NGN.version === require('../package.json').version, 'Version number is available.')
  NGN.Log.disable()
  t.ok(typeof NGN.Log === 'object', 'NGN.Log exists.')
  t.ok(typeof NGN.BUS === 'object', 'NGN.BUS exists.')
  t.ok(typeof NGN.Class === 'function', 'NGN.Class exists.')
  t.ok(typeof NGN.Server === 'function', 'NGN.Server exists.')
  t.ok(typeof NGN.Tunnel === 'function', 'NGN.Tunnel (ssh) exists.')
  t.ok(typeof NGN.createException === 'function', 'NGN.createException exists.')
  t.ok(typeof NGN.rpc === 'object', 'NGN.rpc namespace exists.')
  t.end()
})
