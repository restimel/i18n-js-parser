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
	},

	getClose: function(refModel) {
		var key, list, threshold;

		threshold = configuration.get('similarThreshold');

		if (typeof refModel === 'string') {
			key = refModel;
		} else {
			key = refModel.get('key');
		}

		list = this.chain().map(function(model) {
			var levenshtein;

			if (model === refModel) {
				return {
					model: model,
					distance: 0
				};
			}

			levenshtein = new Levenshtein(key, model.get('key'));

			return {
				model: model,
				distance: levenshtein.distance / key.length
			};
		}).filter(function(o) {
			return o.distance < threshold && o.model !== refModel;
		}).sortBy('distance')
		  .pluck('model')
		  .value();

		return list;
	}
});
