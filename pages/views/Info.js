'use strict';

var Info = Backbone.View.extend({
	el: '.search-info',

	template: _.template($('#infoTemplate').html()),

	events: {
		'click .save': 'onSave',
		'click .command-action': 'onAction'
	},

	initialize: function(options) {
		this.fullDictionary = options.fullDictionary;
		this.filteredDictionary = options.filteredDictionary;

		this.listenTo(this.filteredDictionary, 'reset', this.onUpdateFiltered);
		this.listenTo(this.fullDictionary, {
			'update:item': this.render,
			'reset:item': this.render
		});
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

	removeItem: function() {
		var number = 0;
		var notRemoved = [];

		this.filteredDictionary.each(function(item) {
			if (this.fullDictionary.remove(item, {silent: true})) {
				number++;
			} else {
				notRemoved.push(item);
			}
		}, this);

		DictionaryItem.similars = {}; // quick clean but could be better managed
		this.fullDictionary.trigger('remove:items', this.filteredDictionary);

		if (_.isEmpty(notRemoved)) {
			notification.success(number + ' items have been deleted.', 8000);
		} else if (number === 0) {
			notification.error('An error appeared during deletion. No items have been deleted.');
		} else {
			notification.warning(number + ' items have been deleted. But ' + notRemoved.length + ' items have not been deleted: "' + _.invoke(notRemoved, 'getName').join('", "') + '".', 20000);
		}
	},

	confirmRemove: function() {
		var message, number;

		number = this.filteredDictionary.length;

		if (number === 0) {
			return;
		}

		message = 'Do you confirm to definitevely remove ' + number + ' items?';
		message += '<details><summary>List of items to be deleted</summary><ul><li>'
		message += this.filteredDictionary.map(function(item) {
			return _.escape(item.getName());
		}).join('</li><li>');
		message += '</li></ul></details>';

		if (this.filteredDictionary.some(function(item) {
			return !item.isUseless();
		})) {
			message += '<br><span class="fa fa-warning"></span> '
					+  'Some items are still in used.<br>'
					+  'Removing these items will lead to a loss of translation for these files.';
		}

		confirmation.confirm(
			'You are about to delete ' + number + ' items!',
			message,
			this.removeItem.bind(this)
		);
	},

	resetItems: function() {
		var number = 0;
		var notReseted = [];
		var list = this.filteredDictionary.filter(function(item) {
			return item.isChanged();
		});

		list.forEach(function(item) {
			if (item.restore({silent: true})) {
				number++;
			} else {
				notReseted.push(item);
			}
		}, this);

		this.fullDictionary.trigger('reset:item', list);

		if (_.isEmpty(notReseted)) {
			notification.success(number + ' items have been reseted.', 8000);
		} else if (number === 0) {
			notification.error('An error appeared during reset. No items have been reseted.');
		} else {
			notification.warning(number + ' items have been reseted. But ' + notReseted.length + ' items have not been reseted: "' + _.invoke(notReseted, 'getName').join('", "') + '".', 20000);
		}
	},

	confirmReset: function() {
		var message, number;

		number = this.filteredDictionary.getNbModified();

		if (number === 0) {
			return;
		}

		message = 'Do you confirm to reset ' + number + ' items?';
		message += '<details><summary>List of items to be reseted</summary><ul><li>'
		message += this.filteredDictionary.filter(function(item) {
			return item.isChanged();
		}).map(function(item) {
			return _.escape(item.getName());
		}).join('</li><li>');
		message += '</li></ul></details>';
		message += '<br>';

		confirmation.confirm(
			'You are about to reset ' + number + ' items!',
			message,
			this.resetItems.bind(this)
		);
	},

	toggleAllFlags: function(flag) {
		var message, result;

		result = _.compact(this.filteredDictionary.toggleFlag(flag));

		if (result.length) {
			message = result.length + ' items have been ';
		} else {
			message = 'No items have been ';
		}

		message += flag ? 'flagged.' : 'unflagged.';

		notification.info(message, 5000);
		this.render();
		editor.render();
	},

	onUpdateFiltered: function() {
		this.render();
	},

	onSave: function() {
		this.fullDictionary.save();
	},

	onAction: function(evt) {
		var action, $target;

		evt.preventDefault();

		$target = $(evt.currentTarget);

		if ($target.parent().hasClass('disabled')) {
			return;
		}

		action = $target.data('action');

		switch(action.toLowerCase()) {
			case 'delete': this.confirmRemove(); break;
			case 'reset': this.confirmReset(); break;
			case 'flag': this.toggleAllFlags(true); break;
			case 'unflag': this.toggleAllFlags(false); break;
			case 'auto-filler': autoGenerator.open(); break;
			default:
				throw new Error('Action "' + action + '" is unknown');
		}
	}
});
