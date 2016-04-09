'use strict';

var DictionaryItem = Backbone.Model.extend({
	defaults: {
		key: '',
		files: [],
		labels: {}
	},

	getName: function() {
		var name = '';

		if (this.has('context')) {
			name += '[' + this.get('context') + '] ';
		}

		name += this.get('key');

		return name;
	},

	isPartial: function() {
		var labels = this.get('labels');
		var configLng = configuration.get('displayLabels');
		var count = 0;
		var isPartial = _.some(labels, function(label, lng) {
			if (configLng.indexOf(lng) !== -1) {
				count++;
				return !_.isString(label) || _.isEmpty(label);
			}
		});

		return isPartial || count < configLng.length;
	},

	isTranslated: function() {
		var labels = this.get('labels');
		var configLng = configuration.get('displayLabels');
		var count = 0;
		var isTranslated = _.every(labels, function(label, lng) {
			if (configLng.indexOf(lng) !== -1) {
				count++;
				return _.isString(label) && !_.isEmpty(label);
			}
			return true;
		});

		return isTranslated && count >= configLng.length;
	},

	isNotTranslated: function() {
		var labels = this.get('labels');
		var configLng = configuration.get('displayLabels');
		var isNotTranslated = _.every(labels, function(label, lng) {
			if (configLng.indexOf(lng) !== -1) {
				return !_.isString(label) || _.isEmpty(label);
			}
			return true;
		});

		return isNotTranslated;
	},

	isUseless: function() {
		return _.isEmpty(this.get('files'));
	},

	isFlagged: function() {
		return !!this.flag;
	},

	isNew: function() {
		if (_.isUndefined(this._isNew)) {
			this._hasRef = refDictionary.retrieve(this);
			this._isNew = !this._hasRef;
		}

		return this._isNew;
	},

	isChanged: function() {
		var changed;

		if (this._isChanged) {
			return true;
		}

		if (!this._hasRef && this.isNew()) {
			this._hasRef = rawDictionary.retrieve(this);
			if (!this._hasRef) {
				return true;
			}
		}

		changed = !this.compare(this._hasRef);

		this._isChanged = changed;

		return changed;
	},

	compare: function(model) {
		var same = true;

		if (this.has('context')) {
			same = this.get('context') === model.get('context');
		} else {
			same = !model.has('context');
		}

		same = same && this.get('key') === model.get('key');

		same = same
		    && this.get('files').length === model.get('files').length
		    && this.get('files').every(function(file)
		{
			return _.contains(model.get('files'), file);
		});

		same = same
		    && _.size(this.get('labels')) === _.size(model.get('labels'))
		    && _.every(this.get('labels'), function(label, lng)
		{
			return model.get('labels')[lng] === label;
		});

		return same;
	},

	restore: function(options) {
		if (this.isChanged()) {
			this.set('files', this._hasRef.get('files').slice(), {silent: true});
			this.set('labels', _.clone(this._hasRef.get('labels')), {silent: true});

			this._isChanged = false;

			if (!options || !options.silent) {
				this.trigger('reset:item', this);
			}
			return true;
		}

		return false;
	},

	toggleFlag: function(flag) {
		if (typeof flag !== 'boolean') {
			flag = !this.flag;
		}

		if (this.flag !== flag) {
			this.flag = flag;
			return true;
		}

		return false;
	},

	autoFill: function(field, withField, postAction) {
		var value, label, item;

		if (this.get('labels')[field]) {
			return false;
		}

		if (withField === 'key-value') {
			value = this.get('key');

		} else if (withField.indexOf('lbl-') === 0) {
			label = withField.substr(4);
			value = this.get('labels')[label];

		} else if (withField.indexOf('same-') === 0) {
			item = this.getClose()[0];
			label = withField.substr(5);
			if (item) {
				value = item.get('labels')[label];
			}
		}

		if (value) {
			this.get('labels')[field] = value;

			switch(postAction) {
				case 'do-flag': this.toggleFlag(true); break;
				case 'do-unflag': this.toggleFlag(false); break;
			}
		}

		return value;
	},

	computeClose: function() {
		var key, list, threshold, refModel;

		threshold = configuration.get('similarThreshold');
		key = this.get('key');
		refModel = this;

		list = fullDictionary.chain().map(function(model) {
			var levenshtein;

			if (model === refModel) {
				return {
					model: model,
					distance: 0
				};
			}

			levenshtein = new Levenshtein(key, model.get('key'));

			return {
				model: model,
				distance: levenshtein.distance / key.length
			};
		}).filter(function(o) {
			return o.distance < threshold && o.model !== refModel;
		}).sortBy('distance')
		  .pluck('model')
		  .value();

		DictionaryItem.similars[this.cid] = list;

		this.trigger('update:similars', this, list);
	},

	getClose: function() {

		if (DictionaryItem.similars[this.cid]) {
			return DictionaryItem.similars[this.cid];
		}

		DictionaryItem.computeClose(this);

		return [];
	},

	clearTags: function() {
		this._hasRef = undefined;
		this._isNew = undefined;
		this._isChanged = undefined;
	}
});

DictionaryItem.similars = {};

DictionaryItem.computeClose = (function() {
	var running = 0;
	var list = [];

	function manageList() {
		var item = list.shift();

		item.computeClose();

		if (list.length) {
			running = setTimeout(manageList, 30);
		} else {
			running = 0;
		}
	}

	return function(item) {
		if (list.indexOf(item) === -1) {
			list.push(item);

			if (!running) {
				running = setTimeout(manageList, 10);
			}
		}
	};
})();
