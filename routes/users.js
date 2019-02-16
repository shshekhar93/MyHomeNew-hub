'use strict';

const { authorize } = require('../libs/passport');

module.exports = app => {
    app.get('/user/@me', authorize, (req, res) => {
        res.json(req.user);
    });

    app.post('/user/@me', authorize, (req, res) => {
        res.status(400).json({});
    });
};
