var Configuration = Backbone.Model.extend({
	defaults: {
		labels: [],
		displayLabels: [],
		similarThreshold: 0.42
	},

	initialize: function() {
		if (_.isEmpty(this.get('displayLabels'))) {
			this.set('displayLabels', _.clone(this.get('labels')), {silent: true});
		}
		this.sortLabel();
	},

	sortLabel: function() {
		this.set('displayLabels', this.get('displayLabels').sort());
	},

	toggleDisplay: function(label, displayed) {
		var index;
		var change = false;
		var displayLabels = this.get('displayLabels');

		if (!_.contains(this.get('labels'), label)) {
			throw new Error('Label ' + label + ' is not known.');
		}

		index = displayLabels.indexOf(label);

		if ((displayed || typeof displayed === 'undefined') && index === -1) {
			displayLabels.push(label);
			change = true;
		} else if (!displayed && index !== -1) {
			displayLabels.splice(index, 1);
			change = true;
		}

		if (change) {
			this.sortLabel();
			this.trigger('change:displayLabels', this, displayLabels);
		}
	}
});
