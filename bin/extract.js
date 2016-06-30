#!/usr/bin/env node

module.exports = bin


// requires
var commander = require('commander')
var debug     = require('debug')('extractors:extract')
var fs        = require('fs')
var url       = require('url')





function bin(argv) {

  commander
  .option('-O, --output [file]', 'Output location')
  .option('-e, --extractor [file]', 'Output location')
  .option('-p, --pages [num]', 'Number of pages')
  .option('-m, --media', 'Extract media')
  .parse(argv)

  uri = commander.args[0] || 'https://github.com/timbl/'


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

  var turtle = extract(uri, pages).then(function (turtle) {
    var path = commander.output
    if (path) {
      fs.writeFileSync(path, turtle)
    } else {
      console.log(turtle)
    }
  })

}


// If one import this file, this is a module, otherwise a library
if (require.main === module) {
  bin(process.argv);
}
