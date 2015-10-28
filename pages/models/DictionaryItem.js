'use strict';

var DictionaryItem = Backbone.Model.extend({
	defaults: {
		key: '',
		files: [],
		labels: {}
	},

	getName: function() {
		var name = '';

		if (this.has('context')) {
			name += '[' + this.get('context') + '] ';
		}

		name += this.get('key');

		return name;
	},

	isPartial: function() {
		var labels = this.get('labels');
		var isPartial = _.some(labels, function(label) {
			return !_.isString(label) || _.isEmpty(label);
		});

		return isPartial || _.size(labels) < configuration.get('labels').length;
	},
	
	isTranslated: function() {
		var labels = this.get('labels');
		var isTranslated = _.every(labels, function(label) {
			return _.isString(label) && !_.isEmpty(label);
		});

		return isTranslated && _.size(labels) >= configuration.get('labels').length;
	},
	
	isNotTranslated: function() {
		var labels = this.get('labels');
		var isNotTranslated = _.every(labels, function(label) {
			return !_.isString(label) || _.isEmpty(label);
		});

		return isNotTranslated;
	},
	
	isUseless: function() {
		return _.isEmpty(this.get('files'));
	},

	isFlagged: function() {
		return !!this.flag;
	},

	toggleFlag: function(flag) {
		if (typeof flag !== 'boolean') {
			flag = !this.flag;
		}

		if (this.flag !== flag) {
			this.flag = flag;
			return true;
		}

		return false;
	},

	autoFill: function(field, withField, postAction) {
		var value, label, item;

		if (this.get('labels')[field]) {
			return false;
		}

		if (withField === 'key-value') {
			value = this.get('key');

		} else if (withField.indexOf('lbl-') === 0) {
			label = withField.substr(4);
			value = this.get('labels')[label];

		} else if (withField.indexOf('same-') === 0) {
			item = this.getClose()[0];
			label = withField.substr(5);
			if (item) {
				value = item.get('labels')[label];
			}
		}

		if (value) {
			this.get('labels')[field] = value;

			switch(postAction) {
				case 'do-flag': this.toggleFlag(true); break;
				case 'do-unflag': this.toggleFlag(false); break;
			}
		}

		return value;
	},

	getClose: function() {
		var key, list, threshold, refModel;

		if (DictionaryItem.similars[this.cid]) {
			return DictionaryItem.similars[this.cid];
		}

		threshold = configuration.get('similarThreshold');
		key = this.get('key');
		refModel = this;

		list = fullDictionary.chain().map(function(model) {
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

		DictionaryItem.similars[this.cid] = list;

		return list;
	}
});

DictionaryItem.similars = {};
