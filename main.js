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

var hasParser = true;

var version = '1.0.0';

/* port number */
var serverPort = 8000;
var configurationPath = '';

/**
 * the main entry point of the program
 * @param {String[]} argv list of arguments given my STDIN
 *
 * node main.js [path to configuration.js]
 */
function main(argv) {
    params(argv);

    configuration.readConfig(configurationPath);
    eventEmitter = new events.EventEmitter();

    eventEmitter.once('ready', startProcess);
    initialization.init(eventEmitter);
}

function params(argv) {
    var args = argv.slice(2);
    var arg, value;

    while (args.length) {
        arg = args.shift();

        if (['-v', '--version'].indexOf(arg) !== -1) {
            console.log('i18n-js-parser v' + version);
            process.exit(0);
        }

        if (arg.indexOf('--port=') === 0) {
            changePort(arg.slice(7));
            continue;
        }

        if (['-p', '--port'].indexOf(arg) !== -1) {
            changePort(args.shift());
        }

        // In other cases it should be the path of configuration file
        if (arg.indexOf('-') !== 0) {
            configurationPath = arg;
        }
    }
}

function changePort(port) {
    var portNb = Number(port);
    if (isNaN(portNb) || portNb > 65535 || portNb < 0 || portNb%1 !== 0) {
        console.error('Port number "%s" is invalid. Please enter a valid port number.', port);
        process.exit(1);
    }

    serverPort = portNb;
}

function startProcess() {
    parser = new Parser(eventEmitter);
    adapter = new Adapter(eventEmitter);

    web.server(eventEmitter, serverPort);
    output.writer(eventEmitter);

    eventEmitter.addListener('parseFiles', parseFiles);

    parseFiles();
}

function parseFiles(callback) {
    if (typeof callback === 'function') {
        eventEmitter.once('parsed:adapter', callback);
    }

    if (configuration.path.parser.files.length > 0) {
        hasParser = true;
        eventEmitter.once('parsed:parser', function() {
            runAdapter(adapter);
        });
        runParser(parser);
    } else {
        hasParser = false;
        runAdapter(adapter);
    }
}

function runParser(parser) {
    parser.parse();
}

function runAdapter(adapter) {
    var lng, dictionaries, parsed;

    function parseFile(dictionary) {
        adapter.parseFile(dictionary, lng, parsed);
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
    if (hasParser && typeof dictionaries === 'string') {
        parsed = true;
        parseFile(dictionaries);
    }

    adapter.writeParsed();
}

/* run script */
main(process.argv);
