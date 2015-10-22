#!/usr/bin/env node
'use strict';

var events = require('events');
var web = require('./modules/web-router.js');
var Adapter = require('./modules/adapter.js');
var translator = require('./modules/translator-writer.js');

/**
 * the main entry point of the program
 * @param {String[]} argv list of arguments given my STDIN
 */
function main() {
    // var argv = require('minimist')(process.argv.slice(2));

    // var option = {
    //     rootFile: argv._[0],
    //     path: (argv.path || '').split(/\s+/),
    //     help: argv.help || argv.h,
    //     port: argv.port || argv.p,
    //     blackList: (argv.exclude || argv.v || '').split(/\s+/),
    //     server: argv.server
    // };

    var eventEmitter = new events.EventEmitter()
    
    var adapter = new Adapter(eventEmitter);

    adapter.parseFile('./ressources/test.json');
    adapter.writeParsed();

    web.server(eventEmitter, 8000);
    translator.writer(eventEmitter);
}

/* run script */
main(process.argv);
