'use strict';

var fs = require('fs');
var tool = require('./tools.js');
var configuration = require('./configuration.js');
var logger = require('./logger.js');

function clean(str) {
	var cleanResult = configuration.adapter.rules.cleanResult;

	if (configuration.adapter.rules.cleanResult instanceof Array) {
		cleanResult.forEach(function(cleaner) {
			if (cleaner instanceof Array) {
				if (typeof cleaner[0] === 'string') {
					cleaner[0] = new RegExp(cleaner[0], 'g');
				}
				str = str.replace(cleaner[0], cleaner[1]);
			}
		});
	}

	return str;
}

/*
 * --------------------------------
 */

function Item() {
	this.key = '';
	this.labels = {};
	this.files = [];
}

Item.prototype.addFile = function(fileName) {
	if (this.files.indexOf(fileName) === -1) {
		this.files.push(fileName);
	}
};

Item.prototype.addLabel = function(lng, value) {
	this.labels[lng] = value;
};

Item.prototype.isValid = function() {
	var isValid = !!this.key;

	isValid = isValid && (typeof this.context === 'undefined' || typeof this.context === 'string');
	isValid = isValid && typeof this.labels === 'object';
	isValid = isValid && this.files instanceof Array && !this.files.some(function(fileName) {
		return typeof fileName !== 'string';
	});
	//TODO check that all keys of this.labels are string

	return isValid;
};

/*
 * --------------------------------
 */

function Adapter(eventEmitter, rules) {
	this.eventEmitter = eventEmitter;
	this.init();
	this.setRules(rules);
}

Adapter.prototype.init = function() {
	this.reading = [];
	this.data = [];
	this.currentItem = new Item();
};

Adapter.prototype.parseFile = function(path, ctxLabel, parsedFile) {
	this.reading.push(path);
	logger.log('start adapting file: ' + path);

	fs.readFile(path, {
		encoding: 'utf8'
	}, function(err, data) {
		var index = this.reading.indexOf(path);

		if (err) {
			console.error(err);
		} else {
			this._analyzeFile(data, ctxLabel, parsedFile, path);
		}
		this.reading.splice(index, 1);

		if (this.reading.length === 0) {
			this.eventEmitter.emit('finish:adapter');
		}
	}.bind(this));
};

Adapter.prototype.toFiles = function() {};

Adapter.prototype.writeParsed = function() {
	var configParsed;

	if (this.reading.length === 0) {
		configParsed = configuration.path.rawDictionary;
		fs.writeFile(configParsed, JSON.stringify(this.data), {
			flags: 'w',
			defaultEncoding: 'utf8',
			mode: parseInt('666', 8)
		}, function(err) {
			if (err) {
				console.error('File "' + configParsed + '" cannot be written.\n' + err);
			} else {
				logger.log('raw file "' + configParsed + '" has been written');
				this.eventEmitter.emit('parsed:adapter');
			}
		}.bind(this));
	} else {
		if (this.eventEmitter) {
			this.eventEmitter.once('finish:adapter', this.writeParsed.bind(this));
		}
	}
};

Adapter.prototype.rules = tool.extend({}, configuration.adapter.rules);

Adapter.prototype.setRules = function(rules) {
	var x;

	if (typeof rules === 'object') {
		for(x in rules) {
			if (rules.hasOwnProperty(x)) {
				this.rules[x] = rules[x];
			}
		}
	} else {
		this.rules = tool.extend({}, configuration.adapter.rules);
	}
};

Adapter.prototype._analyzeFile = function(file, ctxLabel, parsedFile, path) {
	var items;

	if (parsedFile) {
		items = JSON.parse(file);
		logger.log('file "' + path + '": ' + items.length + ' items with JSON parsing');
	} else {
		items = file.split(this.rules.newItem);
		logger.log('file "' + path + '": ' + items.length + ' items with separator ' + this.rules.newItem.toString());
	}

	items.forEach(function(chunk) {
		this._newItem();
		var parser, part;

		/* look for key */
		if (parsedFile) {
			this.currentItem.key = chunk.key;
		} else {
			parser = chunk.match(this.rules.getKey);
			logger.log('[' + path + '] key-parser result: ' + parser + ' --- getKey regExp: ' + this.rules.getKey.toString() + '\nchunk:\n' + chunk);

			if (!parser || !parser[1]) {
				return;
			}

			this.currentItem.key = clean(parser[1]);
		}
		logger.log('[' + path + '] key: '+ this.currentItem.key);

		/* look for context */
		if (parsedFile) {
			this.currentItem.context = chunk.context;
		} else {
			parser = chunk.match(this.rules.getContext);

			logger.log('[' + path + '][' + this.currentItem.key + '] context-parser result: ' + parser + ' --- getContext regExp: ' + this.rules.getContext.toString());
			if (parser && parser[1]) {
				this.currentItem.context = clean(parser[1]);
			}
		}
		logger.log('[' + path + '][' + this.currentItem.key + '] context: '+ this.currentItem.context);

		/* look for label(s) */
		if (parsedFile) {
			if (chunk.labels) {
				tool.each(chunk.labels, function(label, lng) {
					this.currentItem.addLabel(lng, label);
				}, this);
			}
		} else {
			if (ctxLabel) {
				parser = chunk.match(this.rules.getLabel);

				if (parser && parser[1]) {
					this.currentItem.addLabel(ctxLabel, clean(parser[1]));
				}
			} else {
				parser = chunk.match(this.rules.getLabels);

				logger.log('[' + path + '][' + this.currentItem.key + '] labels-parser result: ' + parser + ' --- getLabels regExp: ' + this.rules.getLabels.toString() + ' --- getLabel regExp: ' + this.rules.getLabel.toString());

				if (parser) {
					if (parser[1] && parser[2]) {
						this.currentItem.addLabel(parser[1], clean(parser[2]));
					} else if(parser[1] && this.rules.getLabel.global) {
						part = parser[1];
						while(parser = this.rules.getLabel.exec(part)) {
							if (parser[1] && parser[2]) {
								this.currentItem.addLabel(parser[1], clean(parser[2]));
							}
						}
						this.rules.getLabel.lastIndex = 0; // restore the index of the rgx
					}
				}
			}
		}

		/* look for file(s) */
		if (parsedFile) {
			chunk.files.forEach(function(file) {
				this.currentItem.addFile(file);
			}, this);
		} else {
			parser = chunk.match(this.rules.getFiles);
			logger.log('[' + path + '][' + this.currentItem.key + '] files-parser result: ' + parser + ' --- getFiles regExp: ' + this.rules.getFiles.toString() + ' --- getFile regExp: ' + this.rules.getFile.toString());

			if (parser) {
				if(parser[1] && this.rules.getFile.global) {
					// look for each file
					part = parser[1];
					while(parser = this.rules.getFile.exec(part)) {
						if (parser[1]) {
							this.currentItem.addFile(clean(parser[1]));
						}
					}
					this.rules.getLabel.lastIndex = 0; // restore the index of the rgx
				}
			}
		}

	}, this);

	this._newItem();
};

Adapter.prototype._saveItem = function() {
	var item;
	var index = -1;

	this.data.some(function(item, idx) {
		var find = item.context === this.currentItem.context && item.key === this.currentItem.key;

		if (find) {
			index = idx;
		}

		return find;
	}, this);

	if (index === -1) {
		if (typeof this.currentItem.key !== 'undefined' && !(/^\s*$/.test(this.currentItem.key))) {
			this.data.push(this.currentItem);
			logger.log('Raw data: Add new item\n' + JSON.stringify(this.currentItem, null, '\t'));
		}
	} else {
		logger.log('Raw data: item [' + this.currentItem.context + '][' + this.currentItem.key + '] already in store');
		item = this.data[index];
		this.currentItem.files.forEach(function(fileName) {
			item.addFile(fileName);
		});

		for (index in this.currentItem.labels) {
			if (this.currentItem.labels.hasOwnProperty(index)) {
				item.addLabel(index, this.currentItem.labels[index]);
			}
		}
	}
};

Adapter.prototype._newItem = function() {
	if (this.currentItem.isValid()) {
		this._saveItem();
	}

	this.currentItem = new Item();
};

module.exports = Adapter;
