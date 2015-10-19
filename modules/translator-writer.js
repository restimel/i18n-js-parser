'use strict';

var fs = require('fs');

function writer(eventEmitter) {
	eventEmitter.addListener('save', saveDictionary);
}

function saveDictionary(dictionary, callback) {
	fs.writeFile('./ressources/dictionary.json', dictionary, {
		flags: 'w',
		defaultEncoding: 'utf8',
		mode: parseInt('666', 8)
	}, callback);
}

exports.writer = writer;
