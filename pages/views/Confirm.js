var Confirm = Backbone.View.extend({
	el: '#confirm-container',
	template: _.template($('#confirmTemplate').html()),
	title: '',
	message : '',

	events: {
		'click .confirm': 'onConfirm',
		'click .cancel': 'onCancel',
		'click .close': 'onCancel'
	},

	render: function() {
		this.$el.html(this.template());

		return this;
	},

	open: function() {
		this.$el.find('.modal-confirm').modal('show');
	},

	close: function() {
		this.$el.find('.modal-confirm').modal('hide');
	},

	confirm: function(title, message, confirmCallback, cancelCallback) {
		this.title = title;
		this.message = message;
		this.confirmCallback = confirmCallback;
		this.cancelCallback = cancelCallback;

		this.render();
		this.$el.find('.modal-confirm').modal('show');
	},

	onConfirm: function() {
		if (typeof this.confirmCallback === 'function') {
			this.confirmCallback();
		}

		this.close();
	},

	onCancel: function() {
		if (typeof this.cancelCallback === 'function') {
			this.cancelCallback();
		}

		this.close();
	}
});
