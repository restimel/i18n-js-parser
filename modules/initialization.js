'use strict';

var fs = require('fs');
var configuration = require('./configuration.js');

var init = {
	eventEmitter: null,
	nbWaiting: 2,
	check: function() {
		if (this.nbWaiting === 0) {
			this.eventEmitter.emit('ready');
		}
	},
	done: function() {
		this.nbWaiting--;
		this.check();
	}
};

function createFile(path, content) {
	fs.writeFile(path, content, {
		flags: 'w',
		defaultEncoding: 'utf8',
		mode: parseInt('666', 8)
	}, function(err) {
		var dirPath;
		/* it was not possible to write the file, maybe the directories does not exist */
		if (err) {
			if (err.errno === -2) {
				dirPath = path.replace(/\/[^\/]+$/, '');
				fs.mkdir(dirPath, parseInt('777', 8), function(err) {
					if (!err || err.errno === -17) {
						createFile(path, content);
					} else {
						console.error('It is not possible to create directories "%s" in order to create file "%s".\nReason: %s (%s)', err.path, path, err.code, err.errno);
						process.exit();
					}
				});
			} else {
				console.error('It is not possible to create the file "%s".\nReason: %s (%s)', err.path, err.code, err.errno);
				process.exit();
			}
		} else {
			console.log('file "%s" has been created.', path);
			init.done();
		}
	});
}

function checkFile(path, defaultContent) {
	if (path[path.length - 1] === '/') {
		return;
	}

	fs.stat(path, function(err, stat) {
		if (err) {
			if (err.errno === -2) {
				createFile(path, defaultContent);
				return;
			} else {
				console.error('Unknwon error: %s (%s)', err.code, err.errno);
				process.exit();
			}
		}
		if (stat.isDirectory()) {
			console.error('The path "%s" is a directory. You cannot set this path as a file.', path);
			process.exit();
		}
		init.done();
	});
}

exports.init = function(eventEmitter) {
	init.eventEmitter = eventEmitter;

	/* check if file exist and create it if it doesn't */
	checkFile(configuration.path.rawDictionary, '[]');
	checkFile(configuration.path.dictionary, '[]');
	checkFile(configuration.path.parsedFile, '');
};

