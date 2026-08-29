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
    if (auth && auth.userId) {
      userId = auth.userId;
      authData = auth;
    }
  } catch (err) {
    // Fallback if getAuth throws
  }

  if (!userId && typeof req.auth === 'function') {
    try {
      const auth = req.auth();
      if (auth && auth.userId) {
        userId = auth.userId;
        authData = auth;
      }
    } catch (err) {}
  } else if (!userId && req.auth && typeof req.auth === 'object') {
    userId = req.auth.userId;
    authData = req.auth;
  }

  // Development fallback header if testing without Clerk session
  if (!userId && req.headers['x-user-id']) {
    userId = req.headers['x-user-id'];
    authData = { userId };
  }

  if (!userId) {
    return next(
      new ApiError(
        401,
        'Unauthorized request. Please sign in to upload and manage PDFs.'
      )
    );
  }

  // Standardize req.userId and req.auth for all controllers
  req.userId = userId;
  req.auth = {
    ...authData,
    userId,
  };

  next();
};
