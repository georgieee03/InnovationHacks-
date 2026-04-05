import { auth } from 'express-openid-connect';

function normalizeBaseUrl(value = '') {
  return String(value).trim().replace(/\/$/, '');
}

export function isAuthConfigured() {
  return Boolean(
    process.env.AUTH0_DOMAIN
    && process.env.AUTH0_CLIENT_ID
    && process.env.AUTH0_CLIENT_SECRET
    && process.env.AUTH0_SECRET
    && process.env.AUTH0_BASE_URL
  );
}

export function createAuthMiddleware() {
  if (!isAuthConfigured()) {
    return null;
  }

  return auth({
    issuerBaseURL: `https://${String(process.env.AUTH0_DOMAIN).trim()}`,
    baseURL: normalizeBaseUrl(process.env.AUTH0_BASE_URL),
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    secret: process.env.AUTH0_SECRET,
    idpLogout: true,
    authRequired: false,
    routes: {
      login: '/api/auth/login',
      logout: '/api/auth/logout',
      callback: '/api/auth/callback',
      postLogoutRedirect: '/',
    },
    authorizationParams: {
      response_type: 'code',
      scope: 'openid profile email',
    },
  });
}

export function getRequestUser(req) {
  if (isAuthConfigured()) {
    if (!req.oidc?.isAuthenticated?.()) {
      return null;
    }

    const profile = req.oidc.user || {};
    return {
      auth0Id: profile.sub,
      email: profile.email || '',
      name: profile.name || profile.nickname || profile.email || 'SafeGuard User',
      picture: profile.picture || '',
    };
  }

  return {
    auth0Id: null,
    email: '',
    name: 'Local Workspace',
    picture: '',
  };
}

export function getPlaidUserId(req) {
  const currentUser = getRequestUser(req);

  if (currentUser?.auth0Id) {
    return currentUser.auth0Id;
  }

  return 'default-user';
}

export function requireSession(req, res, next) {
  const currentUser = getRequestUser(req);

  if (!currentUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  req.currentUser = currentUser;
  return next();
}

export function attachSessionUser(req, _res, next) {
  req.currentUser = getRequestUser(req);
  next();
}
