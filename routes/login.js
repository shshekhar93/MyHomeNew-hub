'use strict';
const fs = require('fs');
const path = require('path');
const { authMiddleware } = require('../libs/passport');

const LOGIN_HTML = fs.readFileSync(path.join(__dirname, '../src/login.html'), 'utf8');

module.exports = (app) => {
    app.get('/login', (req, res) => {
        const redirectTo = req.query.redirectTo;
        res.type('html').send(LOGIN_HTML.replace('{redirectTo}', redirectTo));
    });
    app.post('/login', authMiddleware, (req, res) => res.status(200).json(req.user));

    app.get('/logout', (req, res) => {
        req.isAuthenticated() && req.logout();
        res.status(200).json({});
    });
};
