'use strict';

var Dictionary = Backbone.Collection.extend({
	model: DictionaryItem,
	initialize: function(options) {
		if (typeof options === 'object') {
			this.url = options.url;
		}
	},

	save: function() {
		this.sync('update', this, {
			success: function() {
				notification.success('Save done', 5000);
				this.trigger('save:success', this);
			}.bind(this),
			error: function(err) {
				notification.error('Save has failed: ' + err.responseText);
			}
		});
	},

	addCopy: function(model, options) {
		return this.add(JSON.parse(JSON.stringify(model)), options);
	},

	copy: function(collection, options) {
		return this.reset(JSON.parse(JSON.stringify(collection)), options);
	},

	autoFill: function(field, withField, postAction) {
		var count = 0;
		this.each(function(model) {
			if (model.autoFill(field, withField, postAction)) {
				count++;
			}
		});

		if (count) {
			this.trigger('change:values', this, count);
		}

		return count;
	},

	/* similar as get but can retrieve similar model */
	retrieve: function(model) {
		var props = {
			key: model.get('key')
		};

		if (!props.key) {
			return false;
		}

		if (model.has('context')) {
			props.context = model.get('context');
		}

		return this.find(function(item) {
			var same = model.get('key') === item.get('key');

			same = same && (model.has('context')
				 ? model.get('context') === item.get('context')
				 : !item.has('context'));

			return same;
		});
	},

	getNbNew: function() {
		var news = this.filter(function(model) {
			return model.isNew();
		});

		return news.length;
	},

	getNbModified: function() {
		var news = this.filter(function(model) {
			return model.isChanged();
		});

		return news.length;
	},

	getNbFlagged: function() {
		var flagged = this.filter(function(model) {
			return model.isFlagged();
		});

		return flagged.length;
	},

	toggleFlag: function(flag) {
		return this.invoke('toggleFlag', flag);
	}
});
