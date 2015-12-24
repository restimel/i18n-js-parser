'use strict';

var Info = Backbone.View.extend({
	el: '.search-info',

	template: _.template($('#infoTemplate').html()),

	events: {
		'click .save': 'onSave',
		'click .command-action': 'onAction',
		'click .reload': 'onReload'
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
			notification.success(__('%d items have been deleted.', number), 8000);
		} else if (number === 0) {
			notification.error(__('An error appeared during deletion. No items have been deleted.'));
		} else {
			notification.warning(__('%d items have been deleted. But %d items have not been deleted: "%s".', number, notRemoved.length, _.invoke(notRemoved, 'getName').join('", "')), 20000);
		}
	},

	confirmRemove: function() {
		var message, number;

		number = this.filteredDictionary.length;

		if (number === 0) {
			return;
		}

		message = __('Do you confirm to definitevely remove %d items?', number);
		message += '<details><summary>' + __('List of items to be deleted:') + '</summary><ul><li>'
		message += this.filteredDictionary.map(function(item) {
			return _.escape(item.getName());
		}).join('</li><li>');
		message += '</li></ul></details>';

		if (this.filteredDictionary.some(function(item) {
			return !item.isUseless();
		})) {
			message += '<br><span class="fa fa-warning"></span> '
					+  __('Some items are still in used.') +'<br>'
					+  __('Removing these items will lead to a loss of translation for these files.');
		}

		confirmation.confirm(
			__('You are about to delete %d items!', number),
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
			notification.success(__('%d items have been reseted.', number), 8000);
		} else if (number === 0) {
			notification.error(__('An error appeared during reset. No items have been reseted.'));
		} else {
			notification.warning(__('%d items have been reseted. But %d items have not been reseted: "%s".', number, notReseted.length, _.invoke(notReseted, 'getName').join('", "')), 20000);
		}
	},

	confirmReset: function() {
		var message, number;

		number = this.filteredDictionary.getNbModified();

		if (number === 0) {
			return;
		}

		message = __('Do you confirm to reset %d items?', number);
		message += '<details><summary>' + __('List of items to be reseted:') +'</summary><ul><li>'
		message += this.filteredDictionary.filter(function(item) {
			return item.isChanged();
		}).map(function(item) {
			return _.escape(item.getName());
		}).join('</li><li>');
		message += '</li></ul></details>';
		message += '<br>';

		confirmation.confirm(
			__('You are about to reset %d items!', number),
			message,
			this.resetItems.bind(this)
		);
	},

	toggleAllFlags: function(flag) {
		var message, result, status;

		result = _.compact(this.filteredDictionary.toggleFlag(flag));

		status = flag ? __('flagged') : __('unflagged');
		if (result.length) {
			message = __('%d items have been %s.', number, status);
		} else {
			message = __('No items have been %s', status);
		}

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

	onReload: function() {
		controller.fetchRaw();
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
				throw new Error(__('Action "%s" is unknown', action));
		}
	}
});
