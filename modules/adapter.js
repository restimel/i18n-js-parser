'use strict';

var fs = require('fs');
var tool = require('./tools.js');
var configuration = require('./configuration.js');
var logger = require('./logger.js');

function clean(str, fileFormat) {
	var cleanResult = configuration.getAdapter(fileFormat).cleanResult;

	if (cleanResult instanceof Array) {
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

function Adapter(eventEmitter) {
	this.eventEmitter = eventEmitter;
	this.init();
}

Adapter.prototype.init = function() {
	this.reading = [];
	this.data = [];
	this.currentItem = new Item();
};

Adapter.prototype.parseFile = function(path, ctxLabel, fileFormat) {
	this.reading.push(path);
	logger.log('start adapting file: ' + path);

	fileFormat = fileFormat || 'default_adapter';

	fs.readFile(path, {
		encoding: 'utf8'
	}, function(err, data) {
		var index = this.reading.indexOf(path);

		if (err) {
			console.error(err);
		} else {
			this._analyzeFile(data, ctxLabel, fileFormat, path);
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

Adapter.prototype._analyzeFile = function(file, ctxLabel, fileFormat, path) {
	var items;
	var isDictionary = fileFormat === 'DICTIONARY';
	var isData = fileFormat === 'DATA';
	var isDictionaryList = fileFormat === 'DICTIONARY_LIST';
	var customRules;

	if (isDictionaryList) {
		items = JSON.parse(file);
		logger.log('file "' + path + '": ' + items.length + ' items with JSON parsing DICTIONARY_LIST');
	} else if (isDictionary) {
		items = [];
		tool.each(JSON.parse(file), function(labels, key) {
			items.push({
				//TODO context
				key: key,
				files: [],
				labels: labels
			});
		});
		logger.log('file "' + path + '": ' + items.length + ' items with JSON parsing DICTIONARY');
		isDictionaryList = true;
	} else if (isData) {
		items = JSON.parse(file);
		//TOdo a real transformation...
		items = Object.keys(items).reduce(function(memo, dico, lng) {
			return memo.concat(Object.keys(dico).map(function(key) {
				var labels = {};
				var label = dico[key];

				labels[lng] = label;
				return {
					//TODO context
					key: key,
					files: [],
					labels: labels
				};
			}));
		}, []);
		logger.log('file "' + path + '": ' + items.length + ' items with JSON parsing DATA');
		isDictionaryList = true;
	} else {
		customRules = configuration.getAdapter(fileFormat).rules;
		items = file.split(customRules.newItem);
		logger.log('file "' + path + '": ' + items.length + ' items with separator ' + customRules.newItem.toString());
	}

	items.forEach(function(chunk) {
		this._newItem();
		var parser, part;

		/* look for key */
		if (isDictionaryList) {
			this.currentItem.key = chunk.key;
		} else {
			parser = chunk.match(customRules.getKey);
			logger.log('[' + path + '] key-parser result: ' + parser + ' --- getKey regExp: ' + customRules.getKey.toString() + '\nchunk:\n' + chunk);

			if (!parser || !parser[1]) {
				return;
			}

			this.currentItem.key = clean(parser[1], fileFormat);
		}
		logger.log('[' + path + '] key: '+ this.currentItem.key);

		/* look for context */
		if (isDictionaryList) {
			this.currentItem.context = chunk.context;
		} else {
			parser = chunk.match(customRules.getContext);

			logger.log('[' + path + '][' + this.currentItem.key + '] context-parser result: ' + parser + ' --- getContext regExp: ' + customRules.getContext.toString());
			if (parser && parser[1]) {
				this.currentItem.context = clean(parser[1], fileFormat);
			}
		}
		logger.log('[' + path + '][' + this.currentItem.key + '] context: '+ this.currentItem.context);

		/* look for label(s) */
		if (isDictionaryList) {
			if (chunk.labels) {
				tool.each(chunk.labels, function(label, lng) {
					this.currentItem.addLabel(lng, label);
				}, this);
			}
		} else {
			if (ctxLabel) {
				parser = chunk.match(customRules.getLabel);

				if (parser && parser[1]) {
					this.currentItem.addLabel(ctxLabel, clean(parser[1], fileFormat));
				}
			} else {
				parser = chunk.match(customRules.getLabels);

				logger.log('[' + path + '][' + this.currentItem.key + '] labels-parser result: ' + parser + ' --- getLabels regExp: ' + customRules.getLabels.toString() + ' --- getLabel regExp: ' + customRules.getLabel.toString());

				if (parser) {
					if (parser[1] && parser[2]) {
						this.currentItem.addLabel(parser[1], clean(parser[2], fileFormat));
					} else if(parser[1] && customRules.getLabel.global) {
						part = parser[1];
						while(parser = customRules.getLabel.exec(part)) {
							if (parser[1] && parser[2]) {
								this.currentItem.addLabel(parser[1], clean(parser[2], fileFormat));
							}
						}
						customRules.getLabel.lastIndex = 0; // restore the index of the rgx
					}
				}
			}
		}

		/* look for file(s) */
		if (isDictionaryList) {
			chunk.files.forEach(function(file) {
				this.currentItem.addFile(file);
			}, this);
		} else {
			parser = chunk.match(customRules.getFiles);
			logger.log('[' + path + '][' + this.currentItem.key + '] files-parser result: ' + parser + ' --- getFiles regExp: ' + customRules.getFiles.toString() + ' --- getFile regExp: ' + customRules.getFile.toString());

			if (parser) {
				if(parser[1] && customRules.getFile.global) {
					// look for each file
					part = parser[1];
					while(parser = customRules.getFile.exec(part)) {
						if (parser[1]) {
							this.currentItem.addFile(clean(parser[1]));
						}
					}
					customRules.getLabel.lastIndex = 0; // restore the index of the rgx
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
