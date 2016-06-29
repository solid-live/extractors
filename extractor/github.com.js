#!/usr/bin/env node

module.exports = extract


// requires
var commander = require('commander')
var debug     = require('debug')('extractors:default')
var qpm_queue = require('qpm_queue')
var osmosis   = require('osmosis')
var solidbot  = require('../')
var uniq      = require('uniq')
var url       = require('url')


// globals
var MAX_PAGES = 1000

var target    = process.argv[2] || 'https://github.com/timbl/'
var base      = url.parse(target).hostname
var interval  = 2
var page      = 1
var nextPage  = 1
var uri       = target + page
var turtle    = ''
var goAgain   = true
var count     = 1


var convertor = {
  'http://schema.org/address' : ['[itemprop=homeLocation]'],
  'http://purl.org/dc/dcam/memberOf' : ['[itemprop=worksFor]'],
  'http://www.w3.org/2000/01/rdf-schema#seeAlso' : ['[itemprop=url]'],
  'http://purl.org/dc/terms/created' : ['.join-date'],
  'http://xmlns.com/foaf/0.1/mbox' : ['[itemprop=email]']
}



function getNextPage(ret) {
  var nextPage

  // process the data
  for (var k in ret) {
    if (ret.hasOwnProperty(k)) {
      v = ret[k]
      if (k === 'urn:string:next' ) {
        if (v && v[0]) {
          nextPage = parseInt(v[0])
        }
      }
    }
  }
  debug('nextpage', nextPage)
  return nextPage

}


function extract(target) {

  return new Promise(function (res, rej) {
    qpm_queue.promiseWhile(function() {
      return goAgain
    }, function() {
      return new Promise(function(resolve, reject) {
        count++
        //var uri = target + nextPage
        var uri = target
        debug(uri)
        solidbot.getPage(uri, convertor, interval)
        .then(function(ret) {

          debug('ret', ret)

          // process the data
          for (var k in ret) {
            if (ret.hasOwnProperty(k)) {
              v = ret[k]
              debug(k)
              debug(v)
              if (k === 'urn:string:next') {
                continue
              }
              if (k === 'http://xmlns.com/foaf/0.1/mbox') {
                v[0] = 'mailto:' + v[0]
              }
              debug('end')
              turtle += solidbot.toTurtle(k, v, base)
            }
          }

          // paginate
          nextPage = getNextPage(ret)
          debug('page', page)
          debug('nextPage', nextPage)
          if (nextPage && !isNaN(parseInt(nextPage)) && nextPage === (page + 1)  && count < MAX_PAGES ) {
            debug('goAgain')
            page = nextPage
            goAgain = true
            uri = target + nextPage
            resolve()
          } else {
            goAgain = false
            resolve()
          }

        })
      })
    }).then(function() {
      // finally
      var unique = solidbot.sortUnique(turtle)
      res(unique)
    })

  })


}


function bin(argv) {
  target = argv[2]

  var turtle = extract(target).then(function (turtle) {
    console.log(turtle)
  })
}


// If one import this file, this is a module, otherwise a library
if (require.main === module) {
  bin(process.argv);
}
