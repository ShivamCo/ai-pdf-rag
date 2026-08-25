import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

export const env = {
  PORT: process.env.PORT,
  ORIGIN_DEV: process.env.ORIGIN_DEV,
  QDRANT_URL: process.env.QDRANT_URL,
  QDRANT_URL_LOCAL: process.env.QDRANT_URL_LOCAL,
  QDRANT_API_KEY: process.env.QDRANT_API_KEY,
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
  CLOUDFLARE_S3_ENDPOINT: process.env.CLOUDFLARE_S3_ENDPOINT,
  CLOUDFLARE_ACCESS_KEY_ID: process.env.CLOUDFLARE_ACCESS_KEY_ID,
  CLOUDFLARE_SECRET_ACCESS_KEY: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
  

};
