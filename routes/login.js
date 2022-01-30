'use strict';
import { readFileSync } from 'fs';
import { authMiddleware } from '../libs/passport.js';

const LOGIN_HTML = readFileSync(new URL('../src/login.html', import.meta.url), 'utf8');

const setupLoginRoutes = (app) => {
  app.get('/login', (req, res) => {
    const redirectTo = req.query.redirectTo;
    res.type('html').send(LOGIN_HTML.replace('{redirectTo}', redirectTo));
  });
  
  app.post('/login', authMiddleware, (req, res) => res.status(200).json(req.user));

  app.get('/logout', (req, res) => {
    req.isAuthenticated() && req.logout();
    res.status(200).json({
      success: true,
    });
  });
};

export default setupLoginRoutes;
