'use strict';

__.configuration({
	locales: ['en', 'fr'],
	localeName: {en: 'English', fr: 'Français'},
    dictionary: 'ressources/i18n_parser_dictionary.json',
    storage: ['localStorage:i18nParserLanguage', 'cookie:i18nParserLanguage']
});

var configuration,
	rawDictionary, fullDictionary, refDictionary, filteredDictionary,
	itemsInfo, search, editor, notification, confirmation, autoGenerator,
	controller,
	mainRender;

/* configuration */
configuration = new Configuration(__projectConfiguration);

/* Collections */
rawDictionary = new Dictionary({
	url: '/data/rawDictionary.json'
});
fullDictionary = new Dictionary({
	url: '/data/dictionary.json'
});
refDictionary = new Dictionary();
filteredDictionary = new Dictionary();

/* Views */
itemsInfo = new Info({
	fullDictionary: fullDictionary,
	filteredDictionary: filteredDictionary
});
search = new Search({
	fullDictionary: fullDictionary,
	filteredDictionary: filteredDictionary
});
editor = new Editor({
	filteredDictionary: filteredDictionary,
	fullDictionary: fullDictionary,
});
notification = new Notification({});
confirmation = new Confirm({});

/* Controller */
controller = new Controller({
	rawDictionary: rawDictionary,
	fullDictionary: fullDictionary,
	filteredDictionary: filteredDictionary,
	refDictionary: refDictionary
});

function init() {
	autoGenerator = new AutoGenerator({
		dictionary: filteredDictionary
	});
}

function mainRender() {
	search.render();
	itemsInfo.render();
	editor.render();
}

function encodeStr(str) {
	if (str) {
		str = str.replace(/[\n\r\t\v\f\b\0]/g, function(p) {
			switch (p) {
				case '\n': return '\\n';
				case '\r': return '\\r';
				case '\t': return '\\t';
				case '\v': return '\\v';
				case '\f': return '\\f';
				case '\b': return '\\b';
				case '\0': return '\\0';
				/* How to manage \u \x ? */
				default: return c;
			}
		});
	}

	return str;
}

function decodeStr(str) {
	if (str) {
		str = str.replace(/\\(.)/g, function(p, c) {
			switch (c) {
				case '\\': return '\\';
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
	}

	return str;
}

function ready() {
	if (!autoGenerator) {
		init();
	}
	mainRender();
}

__.configuration({
	onLocaleReady: ready
});
