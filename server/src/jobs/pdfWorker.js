import http from 'http';
import { fileURLToPath } from 'url';
import { Worker } from 'bullmq';
import { isRedisConfigured, redisConfig } from '../config/redis.js';
import { processPdfAndStore } from '../services/pdf.service.js';

export const startPdfWorker = () => {
  if (!isRedisConfigured()) {
    return null;
  }

  try {
    const worker = new Worker(
      'pdf-upload-queue',
      async (job) => {
        const rawData = job.data;
        const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

        if (!data?.r2Key && !data?.path) {
          throw new Error('Invalid job payload: missing r2Key or file path');
        }

        return await processPdfAndStore({
          documentId: data.documentId,
          userId: data.userId,
          r2Key: data.r2Key,
          path: data.path,
        });
      },
      {
        concurrency: 5,
        connection: redisConfig,
      }
    );

    worker.on('error', (err) => {
      console.warn('Worker connection error:', err.message);
    });

    worker.on('failed', (job, error) => {
      console.error(`Job ${job?.id} failed:`, error.message);
    });

    return worker;
  } catch (err) {
    console.warn('Failed to start worker:', err.message);
    return null;
  }
};

startPdfWorker();

// Standalone worker HTTP port for container health checks
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const PORT = process.env.PORT || 8080;
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'pdf-worker' }));
  });

  server.listen(PORT, () => {
    console.log(`Worker listening on port ${PORT}`);
  });
}


