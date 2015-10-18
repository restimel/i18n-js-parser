var Editor = Backbone.View.extend({ 
	el: '.editor',

	initialize: function(options) {
		this.filteredDictionary = options.filteredDictionary;
		this.subviews = [];

		this.listenTo(this.filteredDictionary, 'reset', this.render);
		this.listenTo(configuration, 'change:displayLabels', this.render);
	},

	render: function() {
		this.clearSubViews();

		this.filteredDictionary.each(this.renderItem, this);

		return this;
	},

	renderItem: function(item) {
		var subview = new EditorItem({
			dictionaryItem: item,
			filteredDictionary: this.filteredDictionary
		});

		this.subviews.push(subview);

		this.$el.append(subview.render().el);
	},

	clearSubViews: function() {
		_.invoke(this.subviews, 'remove');
	}
});
