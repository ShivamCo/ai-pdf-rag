import app from './app.js';
import { env } from './config/env.js';

const PORT = env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);

  if (process.env.START_WORKER !== 'false') {
    import('./jobs/pdfWorker.js').catch((err) => {
      console.error('Failed to start worker:', err.message);
    });
  }
});

