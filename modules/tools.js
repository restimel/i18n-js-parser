
exports.extend = function extend(obj1, obj2) {
	var key;

	for (key in obj2) {
		if (typeof obj1[key] === 'object' && !(obj1[key] instanceof RegExp)) {
			extend(obj1[key], obj2[key]);
		} else {
			obj1[key] = obj2[key];
		}
	}

	return obj1;
};
