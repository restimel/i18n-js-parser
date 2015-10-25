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

	autoFill: function(field, withField) {
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
			item = fullDictionary.getClose(this) [0];
			label = withField.substr(5);
			if (item) {
				value = item.get('labels')[label];
			}
		}

		if (value) {
			this.get('labels')[field] = value;
		}

		return value;
	}
});
