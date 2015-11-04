var Notification = Backbone.View.extend({
	el: '.notification',

	template: _.template($('#notificationTemplate').html()),
	timerTpl: _.template($('#timerTemplate').html()),

	events: {
		'click .close': 'clear'
	},

	render: function() {
		this.$el.html(this.template());

		return this;
	},

	message: function(message, timer) {
		clearTimeout(this.timer);

		this.msg = message;
		this.render();
		if (typeof timer === 'number') {
			this.timer = setTimeout(this.clear.bind(this), timer);
		}
	},

	info: function(message, timer) {
		this.type = 'info';
		this.message(message, timer);
	},

	success: function(message, timer) {
		this.type = 'success';
		this.message(message, timer);
	},

	warning: function(message, timer) {
		this.type = 'warning';
		this.message(message, timer);
	},

	error: function(message, timer) {
		this.type = 'danger';
		this.message(message, timer);
	},

	waitFor: function(message) {
		this.msg = message;
		this.$el.html(this.timerTpl());
	},

	clear: function() {
		this.$el.html('');
	}
});