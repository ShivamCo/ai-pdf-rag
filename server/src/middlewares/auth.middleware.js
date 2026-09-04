import { clerkMiddleware, getAuth } from '@clerk/express';
import { ApiError } from '../utils/apiError.js';
import { env } from '../config/env.js';

export const clerkAuthHandler = clerkMiddleware({
  secretKey: env.CLERK_SECRET_KEY,
  publishableKey: env.CLERK_PUBLISHABLE_KEY,
});

export const requireAuthentication = (req, res, next) => {
  let userId = null;
  let authData = {};

  try {
    const auth = getAuth(req);
    if (auth?.userId) {
      userId = auth.userId;
      authData = auth;
    }
  } catch {}

  if (!userId && typeof req.auth === 'function') {
    try {
      const auth = req.auth();
      if (auth?.userId) {
        userId = auth.userId;
        authData = auth;
      }
    } catch {}
  } else if (!userId && req.auth?.userId) {
    userId = req.auth.userId;
    authData = req.auth;
  }

  // Fallback header for development/testing
  if (!userId && req.headers['x-user-id']) {
    userId = req.headers['x-user-id'];
    authData = { userId };
  }

  if (!userId) {
    return next(new ApiError(401, 'Please sign in to continue'));
  }

  req.userId = userId;
  req.auth = {
    ...authData,
    userId,
  };

  next();
};

