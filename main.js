#!/usr/bin/env node
'use strict';

var events = require('events');
var configuration = require('./modules/configuration.js');
var web = require('./modules/web-router.js');
var Adapter = require('./modules/adapter.js');
var translator = require('./modules/translator-writer.js');

/**
 * the main entry point of the program
 * @param {String[]} argv list of arguments given my STDIN
 */
function main() {

    var eventEmitter = new events.EventEmitter()
    var adapter = new Adapter(eventEmitter);

    web.server(eventEmitter, 8000);
    translator.writer(eventEmitter);

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
