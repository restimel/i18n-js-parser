'use strict';

var fs = require('fs');
var configuration = require('./configuration.js');

var configDictionary = './ressources/dictionary.json';

function writer(eventEmitter) {
	eventEmitter.addListener('save', saveDictionary);
}

function saveDictionary(dictionary, callback) {
	var obj;

	try {
		obj = JSON.parse(dictionary);
	} catch(e) {
		callback(e);
	}

	fs.writeFile(configDictionary, dictionary, {
		flags: 'w',
		defaultEncoding: 'utf8',
		mode: parseInt('666', 8)
	}, callback);

	writeDictionaries(obj);
}

function writeDictionaries(dictionary) {
	configuration.output.forEach(function(file) {
		fs.writeFile(file.path, template(file.format, {ITEMS: dictionary}), {
			flags: 'w',
			defaultEncoding: 'utf8',
			mode: parseInt('666', 8)
		}, function(err) {
			if (err) {
				console.warn('Error while writing file "' + file.path + '".', err);
				return;
			}
			console.log('file "' + file.path + '" updated');
		});
	});
}

function template(format, ctx) {
	var text;
	var searchTag = /@([^@\s\[{]*(?:\[([^\]\s]*)\](?:\([^\)]*\))?)?(?:\{([^}]*)\})?)@/g;

	if (typeof format !== 'string') {
		return format;
	}

	text = format.replace(searchTag, function(p, code) {
		var txt, args, tag, iterator, iteratorTag, jointure, condition, key;

		function getTemplate(value, key) {
			var context;

			context = ctx;

			switch (iteratorTag) {
				case 'ITEMS':
					context = {
						ITEMS: ctx.items,
						ITEM: value,
						CONTEXT: value.context,
						KEY: value.key,
						FILES: value.files,
						LABELS: value.labels
					};
					break;
				case 'LABELS':
					context.LNG = key;
					context.LABEL = value;
					break;
				case 'FILES':
					context.FILE = value;
					break;
			}

			return template(tag, context);
		}

		if (!code) {
			return '@';
		}

		args = code.match(/^([^\[{]*)(?:\[([^\]]*)\](?:\(([^\)]*)\))?)?(?:\{([^}]*)\})?$/);
		if (!args) {
			console.warn('template "@' + code + '@" is not in valid format. It should be like "@tag[tag](separators){condition}@"');
			return p;
		}

		tag = getCode(args[1], ctx);
		iteratorTag = args[2];
		iterator = getCode(iteratorTag, ctx);
		jointure = args[3];
		condition = args[4];

		if (typeof condition !== 'undefined' && !getCode(condition, ctx)) {
			return '';
		}

		if (iterator) {
			if (typeof iterator !== 'object') {
				console.warn('it is not possible to iterate on "' + iteratorTag + '" which is neither an Array neither an Object.');
				return p;
			}

			if (iterator instanceof Array) {
				txt = iterator.map(getTemplate);
			} else {
				txt = [];

				for (key in iterator) {
					if (iterator.hasOwnProperty(key)) {
						txt.push(getTemplate(iterator[key], key));
					}
				}
			}
			txt = txt.join(jointure || '');
			return txt;
		}

		if (searchTag.test(tag)) {
			tag = template(tag, ctx);
		}

		return tag || '';
	});

	//TODO beautifier

	return text;
}

function getCode(code, ctx) {
	var properties, tag, value;

	if (typeof code !== 'string') {
		return code;
	}

	properties = code.split('.');
	tag = properties.shift();
	value = ctx[tag];

	if (typeof value === 'undefined') {
		value = configuration.templates[tag];
	}

	properties.some(function(prop) {
		if (typeof value === 'undefined') {
			console.warn('It is not possible to read property "' + prop + '" of undefined from tag "' + code + '".');
			return true;
		}
		value = value[prop];
	});

	return value;
}


exports.writer = writer;
