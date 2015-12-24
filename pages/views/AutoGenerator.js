var AutoGenerator = Backbone.View.extend({
	el: '.auto-generator',

	template: _.template($('#autoGeneratorTemplate').html()),

	events: {
		'click .run': 'run'
	},

	initialize: function(options) {
		this.dictionary = options.dictionary;
		this.render();
	},

	render: function() {
		this.$el.html(this.template());

		return this;
	},

	open: function() {
		this.$el.find('.modal-auto-generator').modal('show');
	},

	close: function() {
		this.$el.find('.modal-auto-generator').modal('hide');
	},

	run: function() {
		var field = this.$el.find('#empty-field-Label').val();
		var withfield = this.$el.find('#fill-with').val();
		var postAction = this.$el.find('#post-actions').val();
		var count = this.dictionary.autoFill(field, withfield, postAction);

		if (count) {
			notification.success(__('%d sentences have been updated.', count), 8000);
		} else {
			notification.info(__('No sentences have been updated.'), 8000);
		}

		this.close();
	}
});
