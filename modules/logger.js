'use strict';

var fs = require('fs');
var configuration = require('./configuration.js');

var loggerPath;

function checkPath() {
	if (typeof loggerPath === 'undefined') {
		loggerPath = configuration.path.log;
	}

	return !!loggerPath;
}

function log(message) {
	var timestamp, text, hasLog;
	
	hasLog = checkPath();
	if (!hasLog && !configuration.verbose) {
		return;
	}

	timestamp = Date.now();
	text = '[' + timestamp + '] - ' + message + '\n';

	if (configuration.verbose) {
		console.log(text);
	}
	if (!hasLog) {
		return;
	}
	fs.appendFile(loggerPath, text, {
		flags: 'a',
		defaultEncoding: 'utf8',
		mode: parseInt('666', 8)
	}, function(err) {
		if (err) {
			console.warn('Error while writing log file "' + loggerPath + '".', err);
		}
	});
};

exports.init = function() {
	if (!checkPath()) {
		return;
	}

	fs.writeFile(loggerPath, '', {
		flags: 'w',
		defaultEncoding: 'utf8',
		mode: parseInt('666', 8)
	}, function(err) {
		if (err) {
			console.warn('Error while writing log file "' + loggerPath + '".', err);
		}
	});

	log('Starting...');
};

exports.log = log;
