var Search = Backbone.View.extend({
	el: '.search',

	events: {
	  'input #filter-contains': 'onContainChange',
	  'input #filter-files': 'onFileChange',
	  'input #filter-status': 'onStatusChange',
	  'change .dsp-lbl': 'onChangeLabelDisplay'
	},

	template: _.template($('#searchTemplate').html()),

	initialize: function(options) {
		this.rawDictionary = options.rawDictionary;
		this.fullDictionary = options.fullDictionary;
		this.filteredDictionary = options.filteredDictionary;

		this.containFilter = this.buildFilter('');
		this.fileFilter = '';
		this.statusFilter = 'All';

		this.listenTo(this.rawDictionary, {
			'reset sync': this.onUpdateFull
		});

		this.listenTo(this.filteredDictionary, {
			'change:values': this.filterCollection
		});

		this.listenTo(this.fullDictionary, {
			'update': this.filterCollection
		});
	},

	render: function() {
		this.$el.html(this.template());

		return this;
	},

	filterCollection: function() {
		var fArr = this.fullDictionary.filter(this.applyFilter, this);

		this.filteredDictionary.reset(fArr);
	},

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
		}

		isValid = isValid && this.containFilter.test(item.get('key'));
		isValid = isValid && (this.fileFilter === '' || _.some(item.get('files'), function(file) {
			return this.fileFilter.test(file);
		}, this));

		return isValid;
	},

	updateItem: function(dictionaryItem) {
		var item = this.fullDictionary.find(function(item) {
			return item.get('key') === dictionaryItem.get('key')
			    && item.get('context') === dictionaryItem.get('context');
		});

		if (!item) {
			this.fullDictionary.add(dictionaryItem);
		} else {
			item.set('files', dictionaryItem.get('files'));
		}
	},

	buildFilter: function(value) {
		value = value.replace(/([-|{}()[\]\\\/.+?^$])/g, '\\$1')
					 .replace(/\*/g, '.*');

		return new RegExp(value, 'i');
	},

	onUpdateFull: function() {
		this.rawDictionary.each(this.updateItem, this);
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
	},

	onChangeLabelDisplay: function(evt) {
		var elem = evt.currentTarget;
		var label = $(elem).data('lng');

		configuration.toggleDisplay(label, elem.checked);
	}
});
