'use strict';

var fs = require('fs');

var configParsed = './ressources/parsed.json';

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

Adapter.prototype.parseFile = function(path, ctxLabel) {
	var data = '';
	var index = this.reading.push(path) -1;

	fs.readFile(path, {
		encoding: 'utf8'
	}, function(err, data) {
		if (err) {
			console.error(err);
		} else {
			this._analyzeFile(data, ctxLabel);
		}
		this.reading.splice(index, 1);

		if (this.reading.length === 0) {
			this.eventEmitter.emit('finish:adapter');
		}
	}.bind(this));
};

Adapter.prototype.toFiles = function() {};

Adapter.prototype.writeParsed = function() {
	if (this.reading.length === 0) {
		fs.writeFile(configParsed, JSON.stringify(this.data), {
			flags: 'w',
			defaultEncoding: 'utf8',
			mode: parseInt('666', 8)
		}, function(err) {
			if (err) {
				console.error('File "' + configParsed + '" cannot be written.\n' + err);
			} else {
				console.log('File parsed written')
				this.eventEmitter.emit('parsed:adapter');
			}
		}.bind(this));
	} else {
		if (this.eventEmitter) {
			this.eventEmitter.once('finish:adapter', this.writeParsed.bind(this));
		}
	}
};

Adapter.prototype.rules = {
	newItem: /\}\s*,\s*\{/,
	getKey: /"key"\s*:\s*"((?:[^"\\]+|\\.)+)"/,
	getContext: /"context"\s*:\s*"((?:[^"\\]+|\\.)+)"/,
	getLabel: /"([^"]+)"\s*:\s*"((?:[^"\\]+|\\.)+)"/g,
	getLabels: /"labels"\s*:\s*\{\s*((?:"(?:[^"\\]+|\\.)+"[\s,:]+)+)\s*\}/,
	getFile: /"((?:[^"\\]+|\\.)+)"/g,
	getFiles: /"files"\s*:\s*\[\s*((?:"(?:[^"\\]+|\\.)+"[\s,]*)+)\]/
};

Adapter.prototype.setRules = function(rules) {
	var x;

	if (typeof rules === 'object') {
		for(x in rules) {
			this.rules[x] = rules[x];
		}
	}
};

Adapter.prototype._analyzeFile = function(file, ctxLabel) {
	var items = file.split(this.rules.newItem);

	items.forEach(function(chunk) {
		this._newItem();
		var parser, part;

		/* look for key */
		parser = chunk.match(this.rules.getKey);

		if (!parser || !parser[1]) {
			return;
		}

		this.currentItem.key = parser[1];

		/* look for context */
		parser = chunk.match(this.rules.getContext);

		if (parser && parser[1]) {
			this.currentItem.context = parser[1];
		}

		/* look for label(s) */
		if (ctxLabel) {
			parser = chunk.match(this.rules.getLabel);

			if (parser && parser[1]) {
				this.currentItem.addLabel(ctxLabel, parser[1]);
			}
		} else {
			parser = chunk.match(this.rules.getLabels);

			if (parser) {
				if (parser[1] && parser[2]) {
					this.currentItem.addLabel(parser[1], parser[2]);
				} else if(parser[1] && this.rules.getLabel.global) {
					// look for each labels
					part = parser[1];
					while(parser = this.rules.getLabel.exec(part)) {
						if (parser[1] && parser[2]) {
							this.currentItem.addLabel(parser[1], parser[2]);
						}
					}
					this.rules.getLabel.lastIndex = 0; // restore the index of the rgx
				}
			}
		}

		/* look for file(s) */
		parser = chunk.match(this.rules.getFiles);

		if (parser) {
			if(parser[1] && this.rules.getFile.global) {
				// look for each file
				part = parser[1];
				while(parser = this.rules.getFile.exec(part)) {
					if (parser[1]) {
						this.currentItem.addFile(parser[1]);
					}
				}
				this.rules.getLabel.lastIndex = 0; // restore the index of the rgx
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
		this.data.push(this.currentItem);
	} else {
		item = this.data[index];
		this.currentItem.files.forEach(function(fileName) {
			item.addFile(fileName);
		});

		for (index in this.currentItem.labels) {
			item.addLabel(index, this.currentItem[index]);
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
