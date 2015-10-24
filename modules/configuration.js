'use strict';

var fs = require('fs');
var tool = require('./tools.js');

var configuration = {
	path: {
		/* The new raw file parsed and aggregated which is sent to Front-end */
		parsedFile: './ressources/parsed.json'
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
	}
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
