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
    var dictionaries = configuration.path.dictionaries.globals;

    if (dictionaries) {
        if (typeof dictionaries === 'string') {
            adapter.parseFile(dictionaries);
        } else if (dictionaries instanceof Array) {
            dictionaries.forEach(function(dictionary) {
                adapter.parseFile(dictionary);
            });
        }
    }

    dictionaries = configuration.path.dictionaries.lng;

    if (dictionaries && typeof dictionaries === 'object') {
        for (lng in dictionaries) {
            if (typeof dictionaries[lng] === 'string') {
                adapter.parseFile(dictionaries[lng]);
            } else if (dictionaries[lng] instanceof Array) {
                dictionaries[lng].forEach(function(dictionary) {
                    adapter.parseFile(dictionary, lng);
                });
            }
        }
    }

    adapter.writeParsed();
}

/* run script */
main(process.argv);
