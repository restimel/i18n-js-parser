var Search = Backbone.View.extend({
	el: '.search',

	events: {
	  'input #filter-context': 'onContextChange',
	  'input #filter-contains': 'onContainChange',
	  'input #filter-files': 'onFileChange',
	  'input #filter-status': 'onStatusChange'
	},

	template: _.template($('#searchTemplate').html()),

	initialize: function(options) {
		this.fullDictionary = options.fullDictionary;
		this.filteredDictionary = options.filteredDictionary;

		this.contextFilter = '';
		this.containFilter = this.buildFilter('');
		this.fileFilter = '';
		this.statusFilter = 'All';

		this.listenTo(this.filteredDictionary, {
			'change:values': this.filterCollection
		});

		this.listenTo(this.fullDictionary, {
			'updated': this.filterCollection,
			'remove:items': this.filterCollection
		});
	},

	render: function() {
		this.$el.html(this.template());

		return this;
	},

	filterCollection: _.throttle(function() {
		var fArr = this.fullDictionary.filter(this.applyFilter, this);

		this.filteredDictionary.reset(fArr);
	}, 200),

	applyFilter: function(item) {
		var isValid;

		switch(this.statusFilter) {
			case 'All':
				isValid = true;
				break;
			case 'Not':
				isValid = item.isNotTranslated();
				break;
			case 'Partial':
				isValid = item.isPartial();
				break;
			case 'Full':
				isValid = item.isTranslated();
				break;
			case 'Useless':
				isValid = item.isUseless();
				break;
			case 'IsNew':
				isValid = item.isNew();
				break;
			case 'IsModified':
				isValid = item.isChanged();
				break;
			case 'Flagged':
				isValid = item.isFlagged();
				break;
			case 'Unflagged':
				isValid = !item.isFlagged();
				break;
		}

		isValid = isValid && (this.contextFilter === '' || item.has('context') && this.contextFilter.test(item.get('context')));
		isValid = isValid && this.containFilter.test(item.get('key'));
		isValid = isValid && (this.fileFilter === '' || _.some(item.get('files'), function(file) {
			return this.fileFilter.test(file);
		}, this));

		return isValid;
	},

	buildFilter: function(value) {
		value = value.replace(/([-|{}()[\]\\\/.+?^$])/g, '\\$1')
					 .replace(/\*/g, '.*');

		return new RegExp(value, 'i');
	},

	onContextChange: function(evt) {
		var value = evt.currentTarget.value;

		this.contextFilter = _.isEmpty(value) ? '' : this.buildFilter(value);
		this.filterCollection();
	},

	onContainChange: function(evt) {
		var value = evt.currentTarget.value;

		this.containFilter = this.buildFilter(value);
		this.filterCollection();
	},

	onFileChange: function(evt) {
		var value = evt.currentTarget.value;

		this.fileFilter = _.isEmpty(value) ? '' : this.buildFilter(value);
		this.filterCollection();
	},

	onStatusChange: function(evt) {
		var value = evt.currentTarget.value;

		this.statusFilter = value;
		this.filterCollection();
	}
});
