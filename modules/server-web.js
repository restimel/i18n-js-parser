'use strict';

var webServer = require('./web-server.js');

function server() {}

function router(req, response, servlet) {
	var pathName = req.url.pathname;
    var query = req.url.query;
    var html;

    switch (pathName) {
        case '/logout':
        case '/exit':
        	servlet.sendHTML_(req, res, 'The program has been shutdown.<script>window.close();</script>', 202);
            process.exit();
        default:
        	servlet.sendHTML_(req, res, 'This page does not exist please check the url.', 404);
        	return;
    }

    servlet.sendHTML_(req, res, html, 200);
}
