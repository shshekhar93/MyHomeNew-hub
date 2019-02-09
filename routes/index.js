'use strict';
const fs = require('fs');
const path = require('path');

module.exports.setupRoutes = (app) => {
    fs.readdirSync(__dirname)
        .filter(name => name.endsWith('.js') && name != __filename)
        .map(routeFile => require(path.join(__dirname, routeFile)))
        .filter(route => typeof route === 'function')
        .forEach(route => route(app));

    app.use((req, res) => 
        fs.createReadStream (
            path.join(__dirname, '..', 'src', 'index.html')
        ).pipe(res.type('html')));
};
