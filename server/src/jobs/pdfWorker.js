import { Worker } from 'bullmq';
import { redisConfig } from '../config/redis.js';
import { processPdfAndStore } from '../services/pdf.service.js';

export const startPdfWorker = () => {
  const worker = new Worker(
    'pdf-upload-queue',
    async (job) => {
      console.log(`\n[Worker Job ${job.id}] Processing PDF upload job...`);

      const rawData = job.data;
      const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

      if (!data?.r2Key && !data?.path) {
        throw new Error(`Invalid job payload: missing r2Key or file path.`);
      }

      console.log(
        `[Worker Job ${job.id}] Target PDF: ${data.r2Key ? `R2 Key (${data.r2Key})` : `Local Path (${data.path})`}`
      );

      const result = await processPdfAndStore({
        documentId: data.documentId,
        userId: data.userId,
        r2Key: data.r2Key,
        path: data.path,
      });

      return result;
    },
    {
      concurrency: 5,
      connection: redisConfig,
    }
  );

  worker.on('completed', (job, result) => {
    console.log(`[Worker Job ${job.id}] Successfully completed!`, result);
  });

  worker.on('failed', (job, error) => {
    console.error(`[Worker Job ${job?.id}] Failed with error:`, error.message);
  });

  console.log('PDF Processing Worker started and waiting for queue jobs...');
  return worker;
};

startPdfWorker();
