const pygmentize = require('pygmentize-bundled')
    , through2   = require('through2')
    , bl         = require('bl')
    , duplexer   = require('reduplexer')
    , mkdirp     = require('mkdirp')
    , path       = require('path')
    , fs         = require('fs')
    , crypto     = require('crypto')
    , stringify  = require('json-stable-stringify')

    , cachePath  = path.resolve(process.env.HOME, '.pygmentize-bundled-cache')


function mkdirpWrap (fn) {
  return function () {
    var args = Array.prototype.slice.call(arguments)

    mkdirp(cachePath, function (err) {
      if (err)
        return args[args.length - 1](err)

      fn.apply(null, args)
    })
  }
}


var fetchFromCache = mkdirpWrap(function _fetchFromCache (_hash, callback) {
  fs.readFile(path.join(cachePath, _hash), function (err, data) {
    if (err && err.code != 'ENOENT')
      return callback(err)

    callback(null, data)
  })
})


function hash (options, data) {
  var shasum = crypto.createHash('md5')
  shasum.update(stringify(options))
  shasum.update(data)
  return shasum.digest('hex')
}


var saveToCache = mkdirpWrap(function _saveToCache (_hash, data, callback) {
  fs.writeFile(path.join(cachePath, _hash), data, 'binary', callback)
})


function pygmentizeToString (options, code, callback) {
  var _hash = hash(options, code)

  fetchFromCache(_hash, function (err, data) {
    if (err) {
      console.error('Warning: ignoring pygmentize-bundled-cached internal error:')
      console.error(err)
    }

    if (data)
      return callback(null, data)

    pygmentize(options, code, function (err, data) {
      saveToCache(_hash, data, function (err) {
        if (err) {
          console.error('Warning: ignoring pygmentize-bundled-cached internal error:')
          console.error(err)
        }
      })

      callback(err, data)
    })
  })
}


function pygmentizeCached (options, code, callback) {
  options = options || {}

  var toString  = typeof code == 'string' && typeof callback == 'function'
    , retStream = !toString && through2()
    , intStream = !toString && through2()
//    , pygmentsStream = !toString && pygmentize(options)
    , duplex

  if (toString)
    return pygmentizeToString(options, code, callback)

  duplex = duplexer(retStream, intStream)
  
  setImmediate(handleStream)

  return duplex

  function handleStream () {
    retStream.pipe(bl(function (err, code) {
      if (err)
        return duplex.emit('error', err)

      pygmentizeToString(options, code.toString('utf8'), function (err, data) {
        if (err)
          return duplex.emit('error', err)

        intStream.end(data)
      })
    }))
  }
}


module.exports = pygmentizeCached