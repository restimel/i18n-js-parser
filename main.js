#!/usr/bin/env node
'use strict';

var events = require('events');
var configuration = require('./modules/configuration.js');
var web = require('./modules/web-router.js');
var Adapter = require('./modules/adapter.js');
var output = require('./modules/translator-writer.js');
var initialization = require('./modules/initialization.js');
var Parser = require('./modules/parser.js');

var eventEmitter;
var parser;
var adapter;

var version = '1.0.0';

/**
 * the main entry point of the program
 * @param {String[]} argv list of arguments given my STDIN
 *
 * node main.js [path to configuration.js]
 */
function main(argv) {
    if (['-v', '--version'].indexOf(argv[2]) !== -1) {
        console.log('i18n-js-parser v' + version);
        process.exit(0);
    }

    configuration.readConfig(argv[2]);
    eventEmitter = new events.EventEmitter();

    eventEmitter.once('ready', startProcess);
    initialization.init(eventEmitter);
}

function startProcess() {
    parser = new Parser(eventEmitter);
    adapter = new Adapter(eventEmitter);

    web.server(eventEmitter, 8000);
    output.writer(eventEmitter);

    eventEmitter.addListener('parseFiles', parseFiles);

    parseFiles();
}

function parseFiles(callback) {
    if (typeof callback === 'function') {
        eventEmitter.once('parsed:adapter', callback);
    }

    if (configuration.path.parser.files.length > 0) {
        eventEmitter.once('parsed:parser', function() {
            runAdapter(adapter);
        });
        runParser(parser);
    } else {
        runAdapter(adapter);
    }
}

function runParser(parser) {
    parser.parse();
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

    dictionaries = configuration.path.parsedFile;
    if (typeof dictionaries === 'string') {
        parseFile(dictionaries);
    }

    adapter.writeParsed();
}

/* run script */
main(process.argv);
