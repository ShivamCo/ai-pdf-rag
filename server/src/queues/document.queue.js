import { Queue } from 'bullmq';
import { redisConfig } from '../config/redis.js';

export const pdfUploadQueue = new Queue('pdf-upload-queue', {
  connection: redisConfig,
});
