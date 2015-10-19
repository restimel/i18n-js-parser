'use strict';

var Info = Backbone.View.extend({
	el: '.search-info',

	template: _.template($('#infoTemplate').html()),

	events: {
		'click .save': 'onSave',
		'click .autoGen': 'onAutoGen'
	},

	initialize: function(options) {
		this.fullDictionary = options.fullDictionary;
		this.filteredDictionary = options.filteredDictionary;

		this.listenTo(this.filteredDictionary, 'reset', this.onUpdateFiltered);
	},

	render: function() {
		this.$el.html(this.template());

		return this;
	},

	getNbPartial: function() {
		var partial = this.filteredDictionary.filter(function(model) {
			return model.isPartial();
		});

		return partial.length;
	},

	getNbUseless: function() {
		var useless = this.filteredDictionary.filter(function(model) {
			return model.isUseless();
		});

		return useless.length;
	},

	onUpdateFiltered: function() {
		this.render();
	},

	onSave: function() {
		this.fullDictionary.save();
	},

	onAutoGen: function() {
		autoGenerator.open();
	}
});
