'use strict';

var DictionaryItem = Backbone.Model.extend({
	defaults: {
		key: '',
		files: [],
		labels: {}
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
		var value;

		if (this.get('labels')[field]) {
			return false;
		}

		if (withField === 'key-value') {
			value = this.get('key');
		} else if (withField.indexOf('lbl-') === 0) {
			value = this.get('labels')[withField.substr(4)];
		}

		this.get('labels')[field] = value;

		return value;
	}
});
