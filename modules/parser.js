'use strict';

var config = require('./configuration.js');
var FileReader = require('./fileReader').FileReader;

function Parser(eventEmitter) {
	this.eventEmitter = eventEmitter;
	this.init();
}

Parser.prototype.init = function() {
	this.files = [];
	this.dictionary = [];
};

Parser.prototype.parseDone = function() {
	console.log('All files are parsed');
	//TODO write parsedFile
	this.eventEmitter.emit('parsed:parser');
}

Parser.prototype.parseFile = function(path, content) {
	if (this.files.indexOf(path) !== -1) {
		return;
	}

	this.files.push(path);
	console.log('File "%s" has been parsed', path);
}

Parser.prototype.parse = function() {
	var exclude = config.path.parser.except;
	var paths = config.path.parser.files;

	var reader = new FileReader(this.parseDone.bind(this), this.parseFile.bind(this));
	reader.setExclude(exclude);

	paths.forEach(reader.read, reader);
};

module.exports = Parser;
