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

var version = '1.0.1';

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

        if (['-h', '--help'].indexOf(arg) !== -1) {
            console.log(command_help());
            process.exit(0);
        }

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

        if (arg == '--verbose') {
            configuration.verbose = true;
        }

        // In other cases it should be the path of configuration file
        if (arg.indexOf('-') !== 0) {
            configurationPath = arg;
        }
    }
}

function command_help() {
    var text = [
        'syntax:',
        '\t node main.js [-h|--help][-v|--version][(-p|--port) <port>][--verbose] <configurationFile>',
        '',
        '-v (or --version): to know the current version of i18n-js-parser',
        '-h (or --help): to have a quick summary of available options',
        '-p (or --port): set the port of webserver (by default it uses port 8000)',
        '--verbose: display also all logs in terminal',
    ];

    return text.join('\n');
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
    var lng, dictionaries, format;

    function parseFile(dictionary) {
        var fileFormat = format;
        var pathDictionary = dictionary;

        if (typeof pathDictionary === 'object') {
            fileFormat = pathDictionary.format || fileFormat;
            pathDictionary = pathDictionary.path;
        }

        adapter.parseFile(pathDictionary, lng, fileFormat);
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
        format = 'DICTIONARY_LIST';
        parseFile(dictionaries);
    }

    adapter.writeParsed();
}

/* run script */
main(process.argv);
