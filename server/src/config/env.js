import dotenv from 'dotenv';

dotenv.config();

export const env = {
  PORT: process.env.PORT || process.env.PORT_DEV || 5000,
  ORIGIN_DEV: process.env.ORIGIN_DEV || '*',
  REDIS_URL: process.env.REDIS_URL || '',
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
  QDRANT_URL: process.env.QDRANT_URL || process.env.QDRANT_URL_LOCAL,
  QDRANT_API_KEY: process.env.QDRANT_API_KEY || '',
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || '',
  CLOUDFLARE_S3_ENDPOINT: process.env.CLOUDFLARE_S3_ENDPOINT || '',
  CLOUDFLARE_ACCESS_KEY_ID: process.env.CLOUDFLARE_ACCESS_KEY_ID || '',
  CLOUDFLARE_SECRET_ACCESS_KEY: process.env.CLOUDFLARE_SECRET_ACCESS_KEY || '',
  CLOUDFLARE_BUCKET_NAME: process.env.CLOUDFLARE_BUCKET_NAME || 'ai-pdf-bucket',
  DATABASE_URL: process.env.DATABASE_URL,
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || '',
  CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY || '',
};
