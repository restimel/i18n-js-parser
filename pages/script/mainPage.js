'use strict';

__.configuration({
	locales: ['en', 'fr'],
	localeName: {en: 'English', fr: 'Français'},
    dictionary: 'ressources/parser_dictionary.json',
    storage: ['localStorage:i18nParserLanguage', 'cookie:i18nParserLanguage']
});

var configuration,
	rawDictionary, fullDictionary, refDictionary, filteredDictionary,
	itemsInfo, search, editor, notification, confirmation, autoGenerator,
	controller,
	mainRender;

/* configuration */
configuration = new Configuration({
	labels: __.getLocales()
});

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

function ready() {
	if (!autoGenerator) {
		init();
	}
	mainRender();
}

__.configuration({
	onLocaleReady: ready
});
