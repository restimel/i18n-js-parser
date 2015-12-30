'use strict';

var lng = ['en', 'fr'];

__.configuration({
    locales: lng,
    dictionary: 'ressources/parser_dictionary.json'
});

var configuration,
	rawDictionary, fullDictionary, refDictionary, filteredDictionary,
	itemsInfo, search, editor, notification, confirmation, autoGenerator,
	controller;

function ready() {
	/* configuration */
	configuration = new Configuration({
		labels: lng
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
	autoGenerator = new AutoGenerator({
		dictionary: filteredDictionary
	});

	/* Controller */
	controller = new Controller({
		rawDictionary: rawDictionary,
		fullDictionary: fullDictionary,
		filteredDictionary: filteredDictionary,
		refDictionary: refDictionary
	});

	search.render();
	itemsInfo.render();
	editor.render();
}

__.configuration({
	onLocaleReady: ready
});