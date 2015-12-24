#!/usr/bin/env node
'use strict';

var events = require('events');
var configuration = require('./modules/configuration.js');
var web = require('./modules/web-router.js');
var Adapter = require('./modules/adapter.js');
var output = require('./modules/translator-writer.js');
var initialization = require('./modules/initialization.js');

var eventEmitter;

/**
 * the main entry point of the program
 * @param {String[]} argv list of arguments given my STDIN
 *
 * node main.js [path to configuration.js]
 */
function main(argv) {
    configuration.readConfig(argv[2]);
    eventEmitter = new events.EventEmitter();

    eventEmitter.once('ready', startProcess);
    initialization.init(eventEmitter);
}

function startProcess() {
    var adapter = new Adapter(eventEmitter);

    web.server(eventEmitter, 8000);
    output.writer(eventEmitter);

    eventEmitter.addListener('parseFiles', function(callback) {
        eventEmitter.once('parsed:adapter', callback);
        runAdapter(adapter);
    });

    runAdapter(adapter);
}

function runAdapter(adapter) {
    var lng, dictionaries;

    function parseFile(dictionary) {
        adapter.parseFile(dictionary, lng);
    }

    dictionaries = configuration.path.dictionaries.globals;
    if (dictionaries) {
        if (typeof dictionaries === 'string') {
            parseFile(dictionaries);
        } else if (dictionaries instanceof Array) {
            dictionaries.forEach(parseFile);
        }
    }

    dictionaries = configuration.path.dictionaries.lng;
    if (dictionaries && typeof dictionaries === 'object') {
        for (lng in dictionaries) {
            if (!dictionaries.hasOwnProperty(lng)) {
                continue;
            }

            if (typeof dictionaries[lng] === 'string') {
                parseFile(dictionaries[lng]);
            } else if (dictionaries[lng] instanceof Array) {
                dictionaries[lng].forEach(parseFile);
            }
        }
    }

    adapter.writeParsed();
}

/* run script */
main(process.argv);
