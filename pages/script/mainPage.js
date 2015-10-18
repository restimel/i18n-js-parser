'use strict';

/* configuration */
var configuration = new Configuration({
	labels: ['en', 'fr']
});

/* Collections */
var rawDictionary = new Dictionary({
	url: '/data/rawDictionary.json'
});
var fullDictionary = new Dictionary({
	url: '/data/dictionary.json'
});
var filteredDictionary = new Dictionary();

/* Views */
var info = new Info({
	fullDictionary: fullDictionary,
	filteredDictionary: filteredDictionary
});
var search = new Search({
	rawDictionary: rawDictionary,
	fullDictionary: fullDictionary,
	filteredDictionary: filteredDictionary
});
var editor = new Editor({
	filteredDictionary: filteredDictionary
});
var notification = new Notification({});
var autoGenerator = new AutoGenerator({
	dictionary: filteredDictionary
});

search.render();
info.render();
editor.render();

function fetchRawDictionary() {
	rawDictionary.fetch();
}

fullDictionary.fetch({
	success: fetchRawDictionary,
	error: fetchRawDictionary
});
