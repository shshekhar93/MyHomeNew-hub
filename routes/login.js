import { successResp } from '../libs/helpers.js';
import { authMiddleware } from '../libs/passport.js';

const setupLoginRoutes = (app) => {
  app.post('/login', authMiddleware, (req, res) => res.status(200).json(req.user));

  app.get('/logout', (req, res) => {
    req.isAuthenticated() && req.logout();
    res.status(200).json(successResp());
  });
};

export default setupLoginRoutes;
