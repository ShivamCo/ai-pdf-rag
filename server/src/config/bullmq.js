import { Queue } from 'bullmq';
import { redisConfig } from './redis.js';

export const pdfQueue = new Queue('pdf-upload-queue', {
  connection: redisConfig,
});
