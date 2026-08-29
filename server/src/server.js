import app from './app.js';
import { env } from './config/env.js';

const PORT = env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`AI PDF RAG API Server is running on port ${PORT}`);

  // Automatically start background PDF worker in single-instance deployments
  if (process.env.START_WORKER !== 'false') {
    import('./jobs/pdfWorker.js')
      .then(() =>
        console.log('⚡ Background PDF Worker initialized in server instance.')
      )
      .catch((err) =>
        console.error('Failed to initialize background worker:', err.message)
      );
  }
});
