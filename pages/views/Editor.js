var Editor = Backbone.View.extend({
	el: '.editor',

	initialize: function(options) {
		this.filteredDictionary = options.filteredDictionary;
		this.fullDictionary = options.fullDictionary;
		this.subviews = [];

		this.indexRendered = 0;
		this.nbItemsPerScreen = 1;
		this.itemSize = 222;
		this.marginNbItem = 5;

		this.$content = this.$('.editor-content');
		this.elPadding = this.$('.editor-padding').get(0);

		this.listenTo(this.filteredDictionary, 'reset', this.render);
		this.listenTo(configuration, 'change:displayLabels', this.render);
		this.el.addEventListener('scroll', this.renderNext.bind(this));
	},

	render: function() {
		this.clearSubViews();

		this.computeNbItemsPerScreen();
		this.renderNext();

		return this;
	},

	renderItem: function(item) {
		var subview = new EditorItem({
			dictionaryItem: item,
			fullDictionary: this.fullDictionary
		});

		this.indexRendered = this.subviews.push(subview);

		this.$content.append(subview.render().el);
	},

	renderItems: function() {
		_.invoke(this.subviews, 'render');
	},

	renderNext: function() {
		// this.indexRendered < this.filteredDictionary.length
		var top = this.el.scrollTop;
		var nbItem = Math.ceil(top / this.itemSize) + this.nbItemsPerScreen + this.marginNbItem;

		this.filteredDictionary.slice(this.indexRendered, nbItem)
			.forEach(this.renderItem, this);

		this.elPadding.style.paddingBottom = Math.max(this.filteredDictionary.length - this.indexRendered, 0) * this.itemSize + 'px';
	},

	computeNbItemsPerScreen: function() {
		var elSize = this.el.offsetHeight;
		var itemSize = this.itemSize; // TODO recompute this size
		var nbItemsPerScreen = Math.ceil(elSize / itemSize);

		this.nbItemsPerScreen = nbItemsPerScreen;
		return this.nbItemsPerScreen;
	},

	clearSubViews: function() {
		_.invoke(this.subviews, 'remove');
		this.subviews = [];
		this.indexRendered = 0;
	}
});
