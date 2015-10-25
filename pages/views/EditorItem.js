'use strict';

var EditorItem = Backbone.View.extend({
	className: 'row',
	template: _.template($('#editorItemTemplate').html()),

	events: {
	  'change .dictionary-label': 'onLabelChange',
	  'click .item-action': 'onAction'
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

	removeItem: function() {
		var deleted = this.fullDictionary.remove(this.dictionaryItem);

		if (deleted) {
			notification.success('item "' + this.dictionaryItem.getName() + '" has been deleted.', 8000);
		} else {
			notification.error('An erorr appeared during deletion of item "' + this.dictionaryItem.getName() + '".');
		}
	},

	confirmRemove: function() {
		var message = 'Do you confirm to definitevely remove item "' + _.escape(this.dictionaryItem.getName()) + '"?';

		if (!this.dictionaryItem.isUseless()) {
			message += '<br><br><span class="glyphicon glyphicon-warning-sign"></span>'
					+  'This item is used in ' + this.dictionaryItem.get('files').length + ' files.<br>'
					+  'Removing this item will lead to a loss of translation for these files.';
		}

		confirmation.confirm(
			'You are about to delete item "' + this.dictionaryItem.get('key') + '"',
			message,
			this.removeItem.bind(this)
		);
	},

	onLabelChange: function(evt) {
		var $input = $(evt.currentTarget);
		var label = $input.data('lng');
		var value = $input.val();

		this.dictionaryItem.get('labels')[label] = value;
		this.renderCallout();
	},

	onAction: function(evt) {
		var action;

		evt.preventDefault();

		action = $(evt.currentTarget).data('action');

		switch(action.toLowerCase()) {
			case 'delete':
				this.confirmRemove();
				break;
			default:
				throw new Error('Action "' + action + '" is unknown');
		}
	}
});
