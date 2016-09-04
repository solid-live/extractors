#!/usr/bin/env node

module.exports = {
  crawlAlbums: crawlAlbums,
  crawlImages: crawlImages,
  crawlLinks: crawlLinks,
  downloadMedia: downloadMedia,
  getImage: getImage,
  getPage: getPage,
  isImage: isImage,
  sortUnique: sortUnique,
  toTurtle: toTurtle
}

// requires
var debug = require('debug')('extractors:extractors')
var fs = require('fs')
var osmosis = require('osmosis')
var request = require('request')
var uniq = require('uniq')
var Xray = require('x-ray')
var x = Xray()

/**
 * Changes a value to an object.
 * @param  {Object} v    The value.
 * @param  {string} base The base.
 * @return {string}      Formatted object.
 */
function toObject (v, base) {
  var ret = ''
  if (v.indexOf('http') === 0 || v.indexOf('mailto:') === 0) {
    ret = '<' + v + '>'
  } else if (v.indexOf('/') === 0) {
    ret = '<' + base + v + '>'
  } else {
    ret = '"""' + v + '"""'
  }
  return ret
}

/**
 * Changes a key value to turtle.
 * @param  {Object} k    The key.
 * @param  {Object} v    The value.
 * @param  {string} base The base.
 * @return {string}      Formatted turtle.
 */
function toTurtle (k, v, base) {
  var turtle = ''
  if (typeof v === 'string') {
    if (v.indexOf('http') === 0 || v.indexOf('mailto:') === 0) {
      turtle += '<#this> <' + k + '> ' + toObject(v, base) + ' .\n'
    }
  } else if (v.length) {
    for (var i = 0; i < v.length; i++) {
      var val = v[i]
      turtle += '<#this> <' + k + '> ' + toObject(val, base) + ' .\n'
    }
  }

  return turtle
}

/**
 * Get page
 * @param  {string} uri       The URI.
 * @param  {Object} convertor The convertor to linked data.
 * @param  {number} interval  The time to wait in seconds.
 * @return {Object}           Returns a promise.
 */
function getPage (uri, convertor, interval) {
  return new Promise(function (resolve, reject) {
    debug('getPage', uri)
    osmosis
      .get(uri)
      .set(convertor)
      .data(function (data) {
        debug(data)
        debug('data')
        setTimeout(function () { resolve(data) }, interval * 1000)
      })
  })
}

/**
 * Get an image.
 * @param  {uri}      uri      The image to get.
 * @param  {Function} callback Callback function.
 */
function getImage (uri, callback) {
  return new Promise(function (resolve, reject) {
    request.get({url: uri, encoding: 'binary'}, function (err, response, body) {
      if (err) {
        reject(err)
      } else {
        resolve(body)
      }
    })
  })
}

/**
 * Crawl images in a URL
 * @param  {stinng}   url      The URL to check.
 * @param  {Function} callback Callback function.
 */
function crawlImages (url, callback) {
  // globals
  url = url || 'https://commons.wikimedia.org/wiki/Category:Art'
  var next = '.next@href'
  var ret = []

  // main
  x(url, 'a', [{
    href: '@href'
  }])
    .paginate(next)
    .limit(1)(function (err, obj) {
      if (err) {
        debug(err)
      } else {
        for (var i = 0; i < obj.length; i++) {
          var href = obj[i].href
          if (!href) {
            continue
          }
          if (isImage(href)) {
            ret.push(href)
          }
        }
        callback(null, ret)
      }
    })
}

/**
 * Test to see if it is an image.
 * @param  {string}  str The string to test.
 * @return {Boolean}     Return true if an image.
 */
function isImage (str) {
  if ((/\.(gif|jpg|jpeg|tiff|png|GIF|JPG|JPEG|TIFF|PNG)$/i).test(str)) {
    return true
  } else {
    return false
  }
}

/**
 * crawls for links
 * @param  {string}   url      The url to crawl
 * @param  {Function} callback Callback function
 */
function crawlLinks (url, callback) {
  // globals
  url = url || 'https://commons.wikimedia.org/wiki/Category:Art'
  var next = '.next@href'
  var ret = []

  // main
  x(url, 'a', [{
    href: '@href'
  }])
    .paginate(next)
    .limit(1)(function (err, obj) {
      if (err) {
        debug(err)
      } else {
        for (var i = 0; i < obj.length; i++) {
          var href = obj[i].href
          if (!href) {
            continue
          }
          ret.push(href)
        }
        callback(null, ret)
      }
    })
}

/**
 * Sniffs for an album
 * @param  {string} str String to sniff
 * @return {boolean}    Whether an album
 */
function sniffAlbum (str) {
  var ret = false

  if (str.indexOf('album/') !== -1) return true
  if (str.indexOf('gallery/') !== -1) return true

  return ret
}

/**
 * Crawls albums
 * @param  {string}   url      The url to crawl
 * @param  {Function} callback Callback function
 */
function crawlAlbums (url, callback) {
  return new Promise(function (resolve, reject) {
    // globals
    url = url || 'https://commons.wikimedia.org/wiki/Category:Art'
    var next = '.next@href'
    var ret = []

    // main
    x(url, 'a', [{
      href: '@href'
    }])
      .paginate(next)
      .limit(1)(function (err, obj) {
        if (err) {
          debug(err)
        } else {
          for (var i = 0; i < obj.length; i++) {
            var href = obj[i].href
            if (!href) {
              continue
            }
            if (sniffAlbum(href)) {
              var defrag = href.split('#')[0]
              ret.push(defrag)
            }
          }
          resolve(ret)
        }
      })
  })
}

/**
 * Sort string delimited by newlines into unique strings
 * @param  {string} str The string to sort.
 * @return {string}     The sorted string.
 */
function sortUnique (str) {
  var ret
  if (!str) {
    return
  }
  var arr = str.split('\n')

  arr = arr.sort()
  arr = uniq(arr)

  ret = arr.join('\n')

  return ret
}

/**
 * download media
 * @param  {string}   uri      The URI to download
 * @param  {string}   filename The file to store it
 * @param  {Function} callback Callback
 */
function downloadMedia (uri, filename, callback) {
  if (!uri || !filename) {
    callback(new Error('uri and filename required'))
  }
  var options = {
    'url': uri,
    'headers': {
      'DNT': 1,
      'Accept-Encoding': 'gzip, deflate, sdch',
      'Accept-Language': 'en-US,en;q=0.8',
      'User-Agent': ' Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/50.0.2661.102 Chrome/50.0.2661.102 Safari/537.36',
      'Connection': 'keep-alive',
      'Cache-Control': 'max-age=0'
    }
  }

  request(options).pipe(fs.createWriteStream(filename)).on('close', callback)
}
