'use strict';

var Info = Backbone.View.extend({
	el: '.search-info',

	template: _.template($('#infoTemplate').html()),

	initialize: function(options) {
		this.fullDictionary = options.fullDictionary;
		this.filteredDictionary = options.filteredDictionary;

		this.commands = new Commands(options);

		this.listenTo(this.filteredDictionary, 'reset', this.onUpdateFiltered);
		this.listenTo(this.fullDictionary, {
			'update:item': this.render,
			'reset:item': this.render
		});
	},

	render: function() {
		this.commands.$el.detach();
		this.$el.html(this.template());

		this.$('.command-panel').html(this.commands.render().el);

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
	}
});
