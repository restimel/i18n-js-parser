'use strict';

var webServer = require('./web-server.js');

function server(eventEmitter, port) {
	if (typeof port !== 'number') {
		port = 8000;
	}
    webServer.handleRequest = router;
    webServer.createServer(port);

    function router(req, res, servlet) {
    	var pathName = req.url.pathname;
        var query = req.url.query;
        var method = req.method;
        var httpBody = req.httpBody;
        var path;

        switch (pathName) {
            case '/logout':
            case '/exit':
            	servlet.sendHTML_(req, res, 'The program has been shutdown.<script>window.close();</script>', 202);
                process.exit();
            case '/':
            	path = './pages/index.html';
            	break;
            case '/data/rawDictionary.json':
                path = './ressources/parsed.json';
                break;
            case '/data/dictionary.json':
                if (method === 'PUT') {
                    eventEmitter.emit('save', httpBody, function(err) {
                        if (err) {
                            servlet.sendHTML_(req, res, err.toString(), 500);
                        } else {
                            servlet.sendHTML_(req, res, httpBody, 200);
                        }
                    });
                    return;
                } else {
                    path = './ressources/dictionary.json';
                }
                break;
            default:
            	pathName = pathName.replace(/\/\.*\//g, '/');
            	path = './pages' + pathName;
        }

        if (/\/$/.test(path)) {
        	servlet.sendDirectory_(req, res, path);
        } else {
        	servlet.sendFile_(req, res, path);
        }
    }
}

exports.server = server;
