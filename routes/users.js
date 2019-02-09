'use strict';

const authMiddleware = function(req, res, next) {
    if(!req.isAuthenticated() || !req.user){
      return res.status(401).json({});
    }
    next();
};

module.exports = app => {
    app.get('/user/@me', authMiddleware, (req, res) => {
        res.json(req.user);
    });

    app.post('/user/@me', authMiddleware, (req, res) => {
        res.status(400).json({});
    });
};