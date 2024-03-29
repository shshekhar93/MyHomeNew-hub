import { errResp, successResp } from '../libs/helpers.js';
import { authMiddleware } from '../libs/passport.js';

const setupLoginRoutes = (app) => {
  app.post('/login', authMiddleware, (req, res) => res.json(req.user));

  app.get('/logout', (req, res) => {
    if (!req.isAuthenticated()) {
      return res.json(successResp());
    }

    req.logout((err) => {
      if (err) {
        return res.status(500).json(errResp());
      }
      return res.json(successResp());
    });
  });
};

export default setupLoginRoutes;
