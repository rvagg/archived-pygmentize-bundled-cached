const pygmentize = require('pygmentize-bundled')
    , through2   = require('through2')
    , bl         = require('bl')
    , duplexer   = require('reduplexer')
    , mkdirp     = require('mkdirp')
    , path       = require('path')
    , fs         = require('fs')
    , crypto     = require('crypto')
    , stringify  = require('json-stable-stringify')

    , home       = (function () {
        if (process.env.HOME)
          return process.env.HOME
        console.error(
            'WARNING: no HOME environment variable set, defaulting to CWD (%s) ' +
            'to store cache (pygmentize-bundled-cached)'
          , process.cwd()
        )
        return process.cwd()
      }())
    , defaultCachePath = path.resolve(home, '.pygmentize-bundled-cache')


function pygmentizeCached (options, code, callback) {
  options = options || {}

  var cachePath = typeof options.cachePath == 'string' ? options.cachePath : defaultCachePath
    , toString  = typeof code == 'string' && typeof callback == 'function'
    , retStream = !toString && through2()
    , intStream = !toString && through2()
//    , pygmentsStream = !toString && pygmentize(options)
    , duplex
    , fetchFromCache = mkdirpWrap(_fetchFromCache)
    , saveToCache = mkdirpWrap(_saveToCache)

  if (toString)
    return pygmentizeToString(options, code, callback)

  duplex = duplexer(retStream, intStream)
  
  setImmediate(handleStream)

  return duplex

  function _fetchFromCache (_hash, callback) {
    fs.readFile(path.join(cachePath, _hash), function (err, data) {
      if (err && err.code != 'ENOENT')
        return callback(err)

      callback(null, data)
    })
  }

  function _saveToCache (_hash, data, callback) {
    fs.writeFile(path.join(cachePath, _hash), data, 'binary', callback)
  }

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

  function hash (options, data) {
    var shasum = crypto.createHash('md5')
    shasum.update(stringify(options))
    shasum.update(data)
    return shasum.digest('hex')
  }

  function pygmentizeToString (options, code, callback) {
    var _hash = hash(options, code)

    function afterSave (err) {
      if (err) {
        console.error('WARNING: ignoring pygmentize-bundled-cached internal error:')
        console.error(err)
      }
    }

    function afterPygmentize (err, data) {
      saveToCache(_hash, data, afterSave)
      callback(err, data)
    }

    function afterFetch (err, data) {
      if (err) {
        console.error('WARNING: ignoring pygmentize-bundled-cached internal error:')
        console.error(err)
      }

      if (data)
        return callback(null, data)

      pygmentize(options, code, afterPygmentize)
    }

    fetchFromCache(_hash, afterFetch)
  }
}


module.exports = pygmentizeCached
