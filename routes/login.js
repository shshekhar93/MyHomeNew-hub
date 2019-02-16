'use strict';

const { authMiddleware } = require('../libs/passport');

module.exports = (app) => {
    app.post('/login', authMiddleware, (req, res) => res.status(200).json(req.user));

    app.get('/logout', (req, res) => {
        req.isAuthenticated() && req.logout();
        res.status(200).json({});
    });
};
