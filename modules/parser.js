'use strict';

var fs = require('fs');
var config = require('./configuration.js');
var FileReader = require('./fileReader.js').FileReader;
var tools = require('./tools.js');
var logger = require('./logger.js');

/* constant */
var extractString = /(['"])((?:\\.|.)+?)\1\s*\+?\s*/g;

var clean = function(data) {
	return data.replace(/\\(.)/g, function(p, c) {
		switch (c) {
			case 'n': return '\n';
			case 'r': return '\r';
			case 't': return '\t';
			case 'v': return '\v';
			case 'f': return '\f';
			case 'b': return '\b';
			case '0': return '\0';
			/* How to manage \u \x ? */
			default: return c;
		}
	});
};

function Parser(eventEmitter) {
	this.eventEmitter = eventEmitter;
	this.init();
}

Parser.prototype.init = function() {
	var callerNames, matcher;

	this.files = [];
	this.dictionary = [];
	this.countFile = 0;
	this.countItem = 0;
	callerNames = '(?:' + config.parser.keys.map(tools.toRegExp).join('|') + ')';

	/* match strings like "i18n('foo' + 'bar')" */
	matcher = '(?:^|\\W)' + callerNames + '\\(((?:\\s*([\'"])(?:\\\\.|.)*?\\2\\s*(?:\\+(?=\\s*[\'"]))?)+)\\s*[,\\)]';
	this.simpleCall = new RegExp(matcher, 'g');

	/* match strings like "i18n.c('context' + 'ctx', 'foo' + 'bar')" */
	/* match strings like "i18n.context('context' + 'ctx', 'foo' + 'bar')" */
	matcher = '(?:^|\\W)' + callerNames + '\.c(?:ontext)?\\(' +
			  '((?:\\s*([\'"])(?:\\\\.|.)*?\\2\\s*(?:\\+(?=\\s*[\'"]))?)+)\\s*,' +
			  '((?:\\s*([\'"])(?:\\\\.|.)*?\\4\\s*(?:\\+(?=\\s*[\'"]))?)+)\\s*[,\\)]';
	this.contextCall = new RegExp(matcher, 'g');
};

Parser.prototype.findItem = function(key, context) {
	var filter = this.dictionary.filter(function(item) {
		/* XXX: == for context to match undefined with '' */
		return item.key === key && item.context == context;
	});

	return filter[0];
};

Parser.prototype.addItem = function(key, context, file) {
	var item = this.findItem(key, context);

	if (!item) {
		this.countItem++;
		item = {
			key: clean(key),
			files: []
		};

		if (context) {
			item.context = clean(context);
		}

		this.dictionary.push(item);
	}

	if (item.files.indexOf(file) === -1) {
		item.files.push(file);
	}
};

Parser.prototype.parseDone = function() {
	var dictionary;
	var parsedFile;

	try {
		dictionary = JSON.stringify(this.dictionary);
	} catch(e) {
		console.error('Error while stringify dictionary. It is not possible to extract strings from files.');
		this.eventEmitter.emit('notParsed:parser');
		return;
	}

	parsedFile = config.path.parsedFile;
	if (typeof parsedFile === 'object') {
		parsedFile = parsedFile.path;
	}
	fs.writeFile(parsedFile, dictionary, {
		flags: 'w',
		defaultEncoding: 'utf8',
		mode: parseInt('666', 8)
	}, function(err) {
		if (err) {
			console.error('It is not possible to write the parsed file. Reason: %s (%d)', err.code, err.errno);
			this.eventEmitter.emit('notParsed:parser');
			return;
		}

		console.log('%d files have been parsed.\n%d strings have been extracted.', this.countFile, this.countItem);
		this.eventEmitter.emit('parsed:parser');
	}.bind(this));
}

Parser.prototype.parseFile = function(path, content) {
	var parse, data, ctx;

	if (this.files.indexOf(path) !== -1) {
		return;
	}

	this.files.push(path);
	logger.log(' parse File "' + path + '"');

	while (parse = this.simpleCall.exec(content)) {
		data = parse[1];
		/* extract string from multi-line data */
		data = data.replace(extractString, '$2');
		this.addItem(data, undefined, path);
	}

	while (parse = this.contextCall.exec(content)) {
		ctx = parse[1];
		data = parse[3];
		/* extract string from multi-line data */
		ctx = ctx.replace(extractString, '$2');
		data = data.replace(extractString, '$2');
		this.addItem(data, ctx, path);
	}

	this.countFile++;
}

Parser.prototype.parse = function() {
	var exclude = config.path.parser.except;
	var paths = config.path.parser.files;

	var reader = new FileReader(this.parseDone.bind(this), this.parseFile.bind(this));
	reader.setExclude(exclude);

	paths.forEach(reader.read, reader);
};

module.exports = Parser;
