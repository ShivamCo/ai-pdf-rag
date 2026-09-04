import { Queue } from 'bullmq';
import { redisConfig, isRedisConfigured } from '../config/redis.js';
import { processPdfAndStore } from '../services/pdf.service.js';

let pdfUploadQueue = null;

if (isRedisConfigured()) {
  try {
    pdfUploadQueue = new Queue('pdf-upload-queue', {
      connection: redisConfig,
    });
    pdfUploadQueue.on('error', (err) => {
      console.warn('Queue connection error:', err.message);
    });
  } catch (err) {
    console.warn('Could not initialize Redis queue:', err.message);
    pdfUploadQueue = null;
  }
}

export const dispatchPdfProcessing = async (jobPayload) => {
  if (pdfUploadQueue) {
    try {
      const jobPromise = pdfUploadQueue.add('file-ready', jobPayload);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Queue timeout')), 2500)
      );
      const job = await Promise.race([jobPromise, timeoutPromise]);
      return { id: job.id, method: 'queue' };
    } catch (err) {
      console.warn(
        'Queue failed, falling back to in-process worker:',
        err.message
      );
    }
  }

  // Fallback to direct execution when Redis queue is not configured or failed
  try {
    const result = await processPdfAndStore({
      documentId: jobPayload.documentId,
      userId: jobPayload.userId,
      r2Key: jobPayload.r2Key,
      path: jobPayload.path,
    });
    return { id: `direct-${Date.now()}`, method: 'direct', ...result };
  } catch (error) {
    console.error(
      `Processing failed for doc ${jobPayload.documentId}:`,
      error.message
    );
    throw error;
  }
};

export { pdfUploadQueue };
