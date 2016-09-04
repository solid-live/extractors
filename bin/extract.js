#!/usr/bin/env node

module.exports = bin

// requires
var debug = require('debug')('extractors:extract')
var commander = require('commander')
var extractors = require('../')
var fs = require('fs')
var url = require('url')

function bin (argv) {
  commander
    .option('-O, --output [file]', 'Output location')
    .option('-e, --extractor [file]', 'Output location')
    .option('-p, --pages [num]', 'Number of pages')
    .option('-m, --media', 'Extract media')
    .option('-d, --document', 'Extract document')
    .parse(argv)

  var uri = commander.args[0] || 'https://github.com/timbl/'
  var document = commander.document
  var media = commander.media
  var output = commander.output
  debug('uri', uri)

  var extractor = commander.extractor
  var extract
  if (extractor) {
    extract = require(extractor)
  } else {
    var parsed = url.parse(uri)
    var hostname = parsed.hostname
    try {
      extract = require('../extractor/' + hostname)
    } catch (e) {
      extract = require('../extractor/default')
    }
  }

  var pages = commander.pages || 1

  if (media) {
    if (!uri || !output) {
      console.error('output and uri requires')
    } else {
      extractors.downloadMedia(uri, output, function (err) {
        if (err) {
          console.error(err)
        } else {
          console.log('extracted', uri, output)
        }
      })
    }
  } else if (document) {
    extractors.downloadDocument(uri, function (err, result) {
      if (err) {
        console.error(err)
      } else {
        if (output) {
          fs.writeFileSync(output, result)
        } else {
          console.log(result)
        }
      }
    })
  } else {
    extract(uri, pages, media).then(function (turtle) {
      var path = commander.output
      if (path) {
        fs.writeFileSync(path, turtle)
      } else {
        console.log(turtle)
      }
    })
  }
}

// If one import this file, this is a module, otherwise a library
if (require.main === module) {
  bin(process.argv)
}
