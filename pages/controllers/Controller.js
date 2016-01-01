'use strict';

var Controller = Backbone.View.extend({
	initialize: function(options) {
		this.fullDictionary = options.fullDictionary;
		this.filteredDictionary = options.filteredDictionary;
		this.rawDictionary = options.rawDictionary;
		this.refDictionary = options.refDictionary;

		this.listenTo(this.fullDictionary, {
			'save:success': this.saveSuccess,
			'sync': this.syncRef
		});

		this.listenTo(this.rawDictionary, {
			'reset': this.addRaw,
			'sync': this.syncRaw
		});

		this._isLoading = true;
		this.fetchFull();
	},

	updateFromRawItem: function(dictionaryItem) {
		var item = this.fullDictionary.retrieve(dictionaryItem);

		if (!item) {
			this.fullDictionary.addCopy(dictionaryItem, {silent: true});
		} else {
			item.set('files', dictionaryItem.get('files'));
			_.each(dictionaryItem.get('labels'), function(label, lng) {
				item.get('labels')[lng] = label;
			});
		}
	},

	saveSuccess: function() {
		this.refDictionary.copy(this.fullDictionary);
		this.fullDictionary.invoke('clearTags');
		this.fullDictionary.trigger('reset:item', this.fullDictionary);
	},

	syncRef: function() {
		this.fetchRaw();
		this.refDictionary.copy(this.fullDictionary);
	},

	addRaw: function() {
		this.rawDictionary.each(this.updateFromRawItem, this);
		this.fullDictionary.each(function(item) {
			/* set useless items */
			if (!this.rawDictionary.retrieve(item)) {
				item.set('files', []);
			}
		}, this);
		this.fullDictionary.trigger('updated', this.fullDictionary);
	},

	syncRaw: function() {
		if (this._isLoading) {
			notification.clear();
			this._isLoading = false;
		} else {
			notification.success(__('Dictionary has been updated'), 5000);
		}
	},

	fetchFull: function() {
		notification.waitFor(__('Loading dictionary data ...'));
		this.fullDictionary.fetch({
			error: this.onFetchError,
			reset: true
		});
	},

	fetchRaw: function() {
		notification.waitFor(__('Updating dictionary with new data ...'));
		this.rawDictionary.fetch({
			error: this.onRawFetchError,
			reset: true,
			data: 'parse=' + !this._isLoading
		});
	},

	onFetchError: function() {
		notification.error(__('An error occurs while getting dictionary data.'));
	},

	onRawFetchError: function() {
		notification.error(__('An error occurs while getting the new dictionary data.'));
	}
});