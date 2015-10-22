'use strict';

var fs = require('fs');

var configDictionary = './ressources/dictionary.json';

function writer(eventEmitter) {
	eventEmitter.addListener('save', saveDictionary);
}

function saveDictionary(dictionary, callback) {
	fs.writeFile(configDictionary, dictionary, {
		flags: 'w',
		defaultEncoding: 'utf8',
		mode: parseInt('666', 8)
	}, callback);
}

exports.writer = writer;
