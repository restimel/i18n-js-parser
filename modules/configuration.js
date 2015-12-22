'use strict';

var fs = require('fs');
var tool = require('./tools.js');

var configuration = {
	path: {
		/* files which contains keys and translations */
		dictionaries: {
			/* files which contains only one language */
			lng: {},
			/* files that contains all translations (which are not specific to one language) */
			globals: []
		},
		/* The new raw file parsed and aggregated which is sent to Front-end */
		parsedFile: './ressources/parsed.json',
		/* The internal dictionary which contains all keys */
		dictionary: './ressources/dictionary.json'
	},
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
	replacements: {},
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
	 */
	templates: {
		item: '{\"key\":\"@KEY@\"@context{CONTEXT}@,\"labels\":{@label[LABELS](,)@},\"files\":[@file[FILES](,)@]}',
		context: ',\"context\":\"@CONTEXT@\"',
		label: '\"@LNG@\":\"@LABEL@\"',
		file: '\"@FILE@\"'
	},
	/* describe which files must be output and how
	 * Tag `@tag@` are defined in templates
	 */
	output: [{
		path: '.ressources/dictionary.json',
		format: '[@item[ITEMS](,)@]'
	}]
};

var fileConfiguration, fileObj;

try {
	fileConfiguration = fs.readFileSync('./configuration.json', {
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
}

module.exports = configuration;
