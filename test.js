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

var cachePath = path.resolve(process.cwd(), '.test-cache')
rimraf.sync(cachePath)

function testCustomCachePath (t) {
  var lang   = 'js'
    , format = 'html'
    , input  = 'var a = "b";'
    , output = '<div class="highlight"><pre><span class="kd">var</span> <span class="nx">a</span> '
        + '<span class="o">=</span> <span class="s2">&quot;b&quot;</span><span class="p">;</span></pre></div>'

  pygmentizeCached(
      {
          lang      : lang
        , format    : format
        , cachePath : cachePath
      }
    , input
    , function (err, result) {
        t.equal(err, null)
        t.ok(Buffer.isBuffer(result), 'isBuffer')
        result = result.toString().replace(/\n/g, '')
        t.equal(result, output)
        t.end()
      }
  )
}

test('test custom cachePath (first)', testCustomCachePath)

// should have called pygmentize() because there is no cache
test('test number of calls to pygmentize should be >0', function (t) {
  t.ok(calls > 0, 'got ' + calls + ' calls')
  calls = 0
  t.end()
})

// should all come from cache now
test('test custom cachePath (second)', testCustomCachePath)

test('test number of calls to pygmentize should be 0', function (t) {
  t.equal(calls, 0, 'got zero calls')
  t.end()
})

test('cleanup', function (t) {
  rimraf(cachePath, t.end)
})