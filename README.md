# pygmentize-bundled-cached

**A caching wrapper for [pygmentize-bundled](https://github.com/rvagg/node-pygmentize-bundled)**

[![NPM](https://nodei.co/npm/pygmentize-bundled-cached.png?downloads=true&downloadRank=true)](https://nodei.co/npm/pygmentize-bundled-cached/)
[![NPM](https://nodei.co/npm-dl/pygmentize-bundled-cached.png?months=6&height=3)](https://nodei.co/npm/pygmentize-bundled-cached/)

The API is exactly the same as [pygmentize-bundled](https://github.com/rvagg/node-pygmentize-bundled), so this is a drop-in replacement but instead of repeatedly calling a child process with Python to run Pygmentize, output will be saved to a cache the first time and served subsequent times.

## Notes

* The cache is located in `~/.pygmentize-bundled-cache` and is not cleaned up automatically, heavy use with new code samples will create a large cache, you have been warned!
* The streaming interface, while still available, is essentially a buffering interface so that the input code can be collected, checked in the cache and the result written back out. Even in the case of a cache-miss the result is still written as a single chunk (the result _could_ be streamed but it's a non-trivial job, pull-requests accepted!).
* The cache consists of MD5 filenames where the hash is taken of a concatenation of the `options` object passed in and the original code sample being converted. Therefore, the same code sample passed in with different options will result in multiple cache entries.

## License

**pygmentize-bundled-cached** is Copyright (c) 2014 Rod Vagg [@rvagg](https://twitter.com/rvagg) and licenced under the MIT licence. All rights not explicitly granted in the MIT license are reserved. See the included LICENSE.md file for more details.
