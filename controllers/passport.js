'use strict';

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const USER = {
  id: '1',
  email: 'shashi20008@gmail.com',
  name: 'Shashi Shekhar'
};

passport.use(new LocalStrategy(
  function(username, password, done) {
    if(username === 'shashi20008@gmail.com' && password === 'testing123') {
      return done(null, USER)
    }
    return done(null, false);
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  done(null, USER);
});

module.exports.authMiddleware = (req, res, next) => {
  passport.authenticate('local', function(err, user, info) {
    if(err) {
      return next(err);
    }

    if(!user) {
      return res.status(401).json({});
    }

    req.login(user, err => {
      if(err) {
        return next(err);
      }
      
      next();
    })
  })(req, res, next);
};
