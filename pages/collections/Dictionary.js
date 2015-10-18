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
			},
			error: function(err) {
				notification.error('Save has failed: ' + err.responseText);
			}
		});
	},

	autoFill: function(field, withField) {
		var count = 0;
		this.each(function(model) {
			if (model.autoFill(field, withField)) {
				count++;
			}
		});

		if (count) {
			this.trigger('change:values', this, count);
		}

		return count;
	}
});
