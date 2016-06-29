#!/usr/bin/env node

module.exports = {
  crawlAlbums : crawlAlbums,
  crawlImages : crawlImages,
  crawlLinks  : crawlLinks,
  getPage     : getPage,
  sortUnique  : sortUnique,
  toTurtle    : toTurtle
}


// requires
var debug   = require('debug')('extractors:extractors')
var osmosis = require('osmosis')
var uniq    = require('uniq')
var Xray    = require('x-ray')
var x       = Xray()


/**
 * Changes a value to an object.
 * @param  {Object} v    The value.
 * @param  {string} base The base.
 * @return {string}      Formatted object.
 */
function toObject(v, base) {

  var ret = ''
  if (v.indexOf('http') === 0 || v.indexOf('mailto:') === 0) {
    ret = '<' + v + '>'
  } else if (v.indexOf('/') === 0) {
    ret = '<' + base + v + '>'
  } else {
    ret = '"' + v + '"'
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
function toTurtle(k, v, base) {

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
function getPage(uri, convertor, interval) {

  return new Promise(function(resolve, reject) {
    debug('getPage', uri)
    osmosis
    .get(uri)
    .set(convertor)
    .data(function(data) {
      debug(data)
      debug('data')
      setTimeout(function () { resolve(data) }, interval*1000)
    })
  })

}


function crawlImages(url, callback) {
  // globals
  url = url || 'https://commons.wikimedia.org/wiki/Category:Art'
  var pattern = 'a'
  var next = '.next@href'
  var ret  = []

  // main
  x(url, 'a', [{
    href: '@href'
  }])
  .paginate(next)
  .limit(1)(function(err, obj) {
    var ttl = ''
    for (var i = 0; i < obj.length; i++) {
      var href = obj[i].href
      if (!href) {
        continue
      }
      if ( (/\.(gif|jpg|jpeg|tiff|png|GIF|JPG|JPEG|TIFF|PNG)$/i).test(href) ) {
        //ttl += '<'+url+'> <https://schema.org/image> <' + obj[i].href + '> .\n'
        ret.push(href)
      }
    }
    callback(null, ret)

  })

}


function crawlLinks(url, callback) {
  // globals
  url = url || 'https://commons.wikimedia.org/wiki/Category:Art'
  var pattern = 'a'
  var next = '.next@href'
  var ret  = []

  // main
  x(url, 'a', [{
    href: '@href'
  }])
  .paginate(next)
  .limit(1)(function(err, obj) {
    var ttl = ''
    for (var i = 0; i < obj.length; i++) {
      var href = obj[i].href
      if (!href) {
        continue
      }
      ret.push(href)
    }
    callback(null, ret)

  })

}


function sniffAlbum(str) {
  var ret = false;

  if (str.indexOf('album/') !== -1) return true;
  if (str.indexOf('gallery/') !== -1) return true;

  return ret
}

function crawlAlbums(url, callback) {
  return new Promise(function (resolve, reject) {

    // globals
    url = url || 'https://commons.wikimedia.org/wiki/Category:Art'
    var pattern = 'a'
    var next = '.next@href'
    var ret  = []

    // main
    x(url, 'a', [{
      href: '@href'
    }])
    .paginate(next)
    .limit(1)(function(err, obj) {
      var ttl = ''
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

    })


  })

}


/**
 * Sort string delimited by newlines into unique strings
 * @param  {string} str The string to sort.
 * @return {string}     The sorted string.
 */
function sortUnique(str) {
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
