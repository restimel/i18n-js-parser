
exports.extend = function extend(obj1, obj2) {
	var key;
	for (key in obj2) {
		if (typeof obj1[key] === 'object') {
			extend(obj1[key], obj2[key]);
		} else {
			obj1[key] = obj2[key];
		}
	}

	return obj1;
};
