'use strict';

var fs = require('fs');
var config = require('./configuration.js');
var tools = require('./tools.js');

function FileReader(finalCallback, fileCallback) {
	this.physicalFolders = [];
	this.finalCallback = finalCallback;
	this.fileCallback = fileCallback;
	this.running = 0;
}

FileReader.prototype.exclude = [];

FileReader.prototype.fileDone = function() {
	this.running--;
	if (this.running <= 0 && typeof this.finalCallback === 'function') {
		this.finalCallback();
	}
};

FileReader.prototype.setExclude = function(exclude) {
	exclude = exclude.map(function(path) {
		if (path instanceof RegExp) {
			return path;
		}
		path = tools.toRegExp(path);
		path += '$';

		return new RegExp(path);
	});

	this.exclude = exclude;
};

FileReader.prototype.isExcluded = function(path) {
	return this.exclude.some(function(exclude) {
		return exclude.test(path);
	});
};

FileReader.prototype.addPhysicalFolders = function(path, search) {
	this.physicalFolders.push({
		path: path,
		search: search.join(',')
	});
}

FileReader.prototype.isAlreadyParsed = function(path, search) {
	search = search.join(',');

	return !path || this.physicalFolders.some(function(pf) {
		return pf.path === path && pf.search === search;
	});
};

FileReader.prototype.readFile = function(path, err, data) {
	if (!err) {
		this.fileCallback(path, data);
	} else {
		console.warn('Warning: file "%s" has not been parsed due to an error while reading. --- [%d] %s', path, err.errno, err.code);
	}
	this.fileDone();
};

FileReader.prototype.readPath = function(paths, currentPath) {
	var dir, isLastDir, validPath, startWithStar, newPaths;

	if (this.isExcluded(currentPath)) {
		this.fileDone();
		return;
	}

	/* check if it is a terminate file */
	if (paths.length === 0) {
		fs.readFile(currentPath, {
				encoding: 'utf8'
			}, this.readFile.bind(this, currentPath));
		return;
	}

	dir = paths[0];
	newPaths = paths.slice(1);

	if (dir.indexOf('*') === -1) {
		/* direct read */
		currentPath += '/' + dir;
		this.readPath(newPaths, currentPath);
		return;
	} else {
		/* parse directory to find all files */

		isLastDir = newPaths.length === 0;
		startWithStar = dir.indexOf('*') === 0;
		validPath = '^' + tools.toRegExp(dir) + '$';
		validPath = new RegExp(validPath);

		fs.readdir(currentPath, function(err, files) {
			files.forEach(function(file) {
				var continueReading = true;
				var fileStat, physicalPath, fpath;

				/* remove . and .. but it should be necessary (as readdir should exclude them) */
				if (['.', '..'].indexOf(file) !== -1) {
					return;
				}

				fpath = currentPath +'/' + file;
				physicalPath = fs.realpathSync(fpath);

				if (continueReading && this.isAlreadyParsed(physicalPath, paths)) {
					continueReading = false;
				} else {
					fileStat = fs.statSync(fpath);
				}

				if (continueReading && !isLastDir && !fileStat.isDirectory()) {
					continueReading = false;
				} else
				if (continueReading && isLastDir && !startWithStar && !fileStat.isFile()) {
					continueReading = false;
				} else
				if (continueReading && !validPath.test(file) && (!startWithStar || !fileStat.isDirectory())) {
					continueReading = false;
				}

				if (continueReading) {
					if (fileStat.isDirectory()) {
						if (!isLastDir) {
							this.addPhysicalFolders(physicalPath, newPaths);
							this.running++;
							this.readPath(newPaths, fpath);
						}

						if (startWithStar) {
							this.addPhysicalFolders(physicalPath, paths);
							this.running++;
							this.readPath(paths, fpath);
						}
					} else {
						/* is a file */
						this.running++;
						this.readPath(newPaths, fpath);
					}
				}
			}, this);
			this.fileDone();
		}.bind(this));
	}
};

FileReader.prototype.read = function(path) {
	var paths = path.split('/');
	var currentPath = '.';

	if (paths[0] === '') {
		paths.shift();
		currentPath = '';
	}

	if (paths.length === 0) {
		return;
	}

	this.running++;
	setTimeout(this.readPath.bind(this), 1, paths, currentPath);
};

exports.FileReader = FileReader;