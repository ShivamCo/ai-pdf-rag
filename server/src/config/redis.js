import { env } from './env.js';

export const redisConfig = env.REDIS_URL
  ? {
      url: env.REDIS_URL,
      maxRetriesPerRequest: null,
    }
  : {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      ...(env.REDIS_PASSWORD ? { password: env.REDIS_PASSWORD } : {}),
      maxRetriesPerRequest: null,
    };
