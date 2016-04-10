'use strict';

var fs = require('fs');
var tool = require('./tools.js');

var configuration = {
	path: {
		/* files to be parsed to build the dictionary
		   "*" can be used as wildcard to match any set of characters */
		parser: {
			/* list of code files to parse */
			files: [],
			/* List of file or directory to not parse */
			except: []
		},
		/* files which contains keys and translations */
		dictionaries: {
			/* files which contains only one language */
			lng: {},
			/* files that contains all translations (which are not specific to one language) */
			globals: []
		},
		/* The file which contains all strings extracted from code files */
		parsedFile: './ressources/parsed.json',
		/* The new raw file parsed and aggregated which is sent to Front-end */
		rawDictionary: './ressources/rawDictionary.json',
		/* The internal dictionary which contains all keys */
		dictionary: './ressources/dictionary.json',
		/* file to log all what happens inside parser and adapter */
		log: ''
	},
	/* configuration related to current project */
	project: {
		/* list all languages handled by the user project */
		lng: ['en', 'fr']
	},
	/* rules to parse files and extract key strings to translate */
	parser: {
		/* name used to translate strings */
		keys: ['i18n']
	},
	/* rules to convert file from parser to the dictionary format */
	adapter: {
		rules: {
			newItem: /\}\s*,\s*\{/,
			getKey: /"key"\s*:\s*"((?:[^"\\]+|\\.)+)"/,
			getContext: /"context"\s*:\s*"((?:[^"\\]+|\\.)+)"/,
			getLabel: /"([^"]+)"\s*:\s*"((?:[^"\\]+|\\.)+)"/g,
			getLabels: /"labels"\s*:\s*\{\s*((?:"(?:[^"\\]+|\\.)+"[\s,:]+)+)\s*\}/,
			getFile: /"((?:[^"\\]+|\\.)+)"/g,
			getFiles: /"files"\s*:\s*\[\s*((?:"(?:[^"\\]+|\\.)+"[\s,]*)+)\]/,
			cleanResult: [["\\\\\"", "\""]]
		}
	},
	/* This object contains all rules for replacements. A rule is an object containing 3 attributes:
     * 		pattern: the pattern to look for (a regular expression)
     *  	flags: the flags to apply on the RegExp
     *  	substr: A string which replace the pattern
	 */
	replacements: {
		esc: {
			pattern: "\"",
			flags: "g",
			substr: "\\\""
		}
	},
	/* define the ouput format
	 * @@	display a @
	 * @tag@ refers to another tag template
	 * @TAG@ refers to predefined tag:
	 *		ITEM: the dictionary item
	 *		KEY: the key of the item
	 *		CONTEXT: the context of the item
	 *		LNG: the language of the sentence (must be used in a LABELS context)
	 *		LABEL: the translation of the sentence (must be used in a LABELS context)
	 *		FILE: the path of the file (must be used in a FILES context)
	 *
	 * @tag[CMD]@ iterate the tag with the CMD as context. Possible CMD:
	 *		ITEMS: the list of items
	 *		LABELS: the list of labels sentences
	 *		FILES: the list of files
	 * @tag[CMD](value)@ join the results with 'value' instead of empty string
	 *
	 * @obj.prop@ get the property 'prop' from the objet 'obj'. obj can be either a tag either a cmd
	 * @tag{CMD}@ display the tag only if CMD is truthy
	 * @tag~replacement@ display the tag and apply the replacement on it. The replacement refers to an attribute defined in "replacements"
	 */
	templates: {
		item: '{\"key\":\"@KEY~esc@\"@context{CONTEXT}@,\"labels\":{@label[LABELS](,)@},\"files\":[@file[FILES](,)@]}',
		context: ',\"context\":\"@CONTEXT~esc@\"',
		label: '\"@LNG@\":\"@LABEL~esc@\"',
		file: '\"@FILE~esc@\"'
	},
	/* describe which files must be output and how
	 * Tag `@tag@` are defined in templates
	 */
	output: [{
		path: './ressources/dictionary.json',
		format: '[@item[ITEMS](,)@]'
	}]
};

configuration.readConfig = function(configPath) {
	var fileConfiguration, fileObj, refPath;

	configPath = configPath || './configuration.json';
	if (/\/$/.test(configPath)) {
		configPath += 'configuration.json';
	} else if (configPath.indexOf('/') === -1) {
		configPath = './' + configPath;
	}
	refPath = configPath.replace(/\/[^\/]+$/, '/');
	configuration.refPath = refPath;

	try {
		fileConfiguration = fs.readFileSync(configPath, {
			encoding: 'utf8'
		});
	} catch(e) {}

	if (fileConfiguration) {
		try{
			fileObj = JSON.parse(fileConfiguration, function(key, value) {
				if (key === 'rules') {
					var k, v, r;
					for(k in value) {
						v = value[k];
						if (typeof v === 'object' && v.source) {
							r = new RegExp(v.source, v.flags);
							value[k] = r;
						}
					}
				}

				return value;
			});
		} catch(err) {
			console.error('configuration.json is not a valid JSON file');
			console.error('reason:', err.message);
			process.exit(1);
		}

		tool.extend(configuration, fileObj);
		updatePaths();
	}
};

configuration.buildPage = function() {
	var str = 'var __projectConfiguration = ';
	var conf = configuration.project;

	str += JSON.stringify(conf);
	str += ';'

	return str;
};

function replace(str) {
	return str.replace(/^(?!\/)(?:\.\/)?/, configuration.refPath);
}

function updatePaths() {
	var k;

	configuration.path.parsedFile = replace(configuration.path.parsedFile);
	configuration.path.rawDictionary = replace(configuration.path.rawDictionary);
	configuration.path.dictionary = replace(configuration.path.dictionary);
	configuration.path.log = replace(configuration.path.log);

	configuration.path.parser.files = configuration.path.parser.files.map(replace);
	/* XXX: except match only the end part of the path so refPath should not been apply */
	// configuration.path.parser.except = configuration.path.parser.except.map(replace);
	configuration.path.dictionaries.globals = configuration.path.dictionaries.globals.map(replace);

	for (k in configuration.path.dictionaries.lng) {
		configuration.path.dictionaries.lng[k] = replace(configuration.path.dictionaries.lng[k]);
	}

	configuration.output.forEach(function(output) {
		output.path = replace(output.path);
	});
}

module.exports = configuration;
