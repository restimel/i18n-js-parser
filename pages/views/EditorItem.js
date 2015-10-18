'use strict';

var EditorItem = Backbone.View.extend({
	className: 'row',
	template: _.template($('#editorItemTemplate').html()),

	events: {
	  'change .dictionary-label': 'onLabelChange'
	},

	initialize: function(options) {
		this.dictionaryItem = options.dictionaryItem;
		this.fullDictionary = options.fullDictionary;
	},

	render: function() {
		this.$el.html(this.template());
		this.renderCallout();

		return this;
	},

	renderCallout: function() {
		var form = this.el.querySelector('.form-horizontal');
		var className = 'form-horizontal bs-callout ';

		if (this.dictionaryItem.isUseless()) {
			className += 'bs-callout-info';
		} else
		if (this.dictionaryItem.isNotTranslated()) {
			className += 'bs-callout-danger';
		} else
		if (this.dictionaryItem.isPartial()) {
			className += 'bs-callout-warning';
		} else
		if (this.dictionaryItem.isTranslated()) {
			className += 'bs-callout-success';
		} else {
			className += 'bs-callout-default';
		}

		form.className = className;
	},

	onLabelChange: function(evt) {
		var $input = $(evt.currentTarget);
		var label = $input.data('lng');
		var value = $input.val();

		this.dictionaryItem.get('labels')[label] = value;
		this.renderCallout();
	}
});
