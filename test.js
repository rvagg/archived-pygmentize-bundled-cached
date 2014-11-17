const test           = require('tape')
    , rimraf         = require('rimraf')
    , path           = require('path')
    , requireSubvert = require('require-subvert')(__dirname)
    , pygmentizeOrig = require('pygmentize-bundled')



var pygmentizeCached
  , pygmentizeTests
  , calls = 0

function pygmentizeProxy () {
  calls++
  return pygmentizeOrig.apply(this, arguments)
}

requireSubvert.subvert('pygmentize-bundled', pygmentizeProxy)

pygmentizeCached = require('./')
pygmentizeTests  = require('pygmentize-bundled/test')

// remove cache so we start from scratch
rimraf.sync(path.resolve(process.env.HOME, '.pygmentize-bundled-cache'))

pygmentizeTests(test, pygmentizeCached)

// should have called pygmentize() because there is no cache
test('test number of calls to pygmentize should be >0', function (t) {
  t.ok(calls > 0, 'got ' + calls + ' calls')
  calls = 0
  t.end()
})

// should all come from cache now
pygmentizeTests(test, pygmentizeCached)

test('test number of calls to pygmentize should be 0', function (t) {
  t.equal(calls, 0, 'got zero calls')
  t.end()
})
