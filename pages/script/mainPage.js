'use strict';

var lng = ['en', 'fr'];

__.configuration({
    locales: lng,
    dictionary: 'ressources/parser_dictionary.json'
});

/* configuration */
var configuration = new Configuration({
	labels: lng
});

/* Collections */
var rawDictionary = new Dictionary({
	url: '/data/rawDictionary.json'
});
var fullDictionary = new Dictionary({
	url: '/data/dictionary.json'
});
var refDictionary = new Dictionary();
var filteredDictionary = new Dictionary();

/* Views */
var itemsInfo = new Info({
	fullDictionary: fullDictionary,
	filteredDictionary: filteredDictionary
});
var search = new Search({
	fullDictionary: fullDictionary,
	filteredDictionary: filteredDictionary
});
var editor = new Editor({
	filteredDictionary: filteredDictionary,
	fullDictionary: fullDictionary,
});
var notification = new Notification({});
var confirmation = new Confirm({});
var autoGenerator = new AutoGenerator({
	dictionary: filteredDictionary
});

/* Controller */
var controller = new Controller({
	rawDictionary: rawDictionary,
	fullDictionary: fullDictionary,
	filteredDictionary: filteredDictionary,
	refDictionary: refDictionary
});

function render() {
	search.render();
	itemsInfo.render();
	editor.render();
}

__.configuration({
	onLocaleReady: render
});