import { env } from './env.js';

export const isRedisConfigured = () => {
  return Boolean(
    env.REDIS_URL || (env.REDIS_HOST && env.REDIS_HOST !== 'localhost' && env.REDIS_HOST !== '127.0.0.1')
  );
};

export const redisConfig = env.REDIS_URL
  ? {
      url: env.REDIS_URL,
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
    }
  : {
      host: env.REDIS_HOST || '127.0.0.1',
      port: env.REDIS_PORT || 6379,
      ...(env.REDIS_PASSWORD ? { password: env.REDIS_PASSWORD } : {}),
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
    };

