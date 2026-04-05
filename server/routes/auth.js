import { Router } from 'express';
import { getRequestUser, isAuthConfigured } from '../auth.js';

const router = Router();

router.get('/session', (req, res) => {
  const currentUser = getRequestUser(req);
  const authEnabled = isAuthConfigured();

  res.json({
    enabled: authEnabled,
    authenticated: Boolean(currentUser && currentUser.auth0Id),
    user: currentUser,
    loginUrl: '/api/login',
    logoutUrl: '/api/logout',
  });
});

export default router;
