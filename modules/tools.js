
/* Allow to extend an object (obj1) from another object (obj2)
 * It creates copy of inner reference, so any changes in obj1 does not impact obj2
 * The reference obj1 is modified by this function */
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

/* Prepare a string to be regexpify.
 * Special characters are escaped
 * All wildcards '*' are changed into '.*' */
exports.toRegExp = function(str) {
	return str.replace(/\\(?![nrs])/g, '\\\\')
			  .replace(/([-.()[\]{}$^|+])/g, '\\$1')
			  .replace(/\*/g, '.*');
};
