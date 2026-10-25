import app from './app.js';
import { env } from './config/env.js';

const PORT = env.PORT || 5000;

const REQUIRED_ENV = [
  'DATABASE_URL',
  'CLERK_SECRET_KEY',
  'CLERK_PUBLISHABLE_KEY',
  'GOOGLE_API_KEY',
  'ANTHROPIC_API_KEY',
  'QDRANT_URL',
];
const missingEnv = REQUIRED_ENV.filter((key) => !env[key]);
if (missingEnv.length) {
  console.error(
    'Missing required environment variables:',
    missingEnv.join(', ')
  );
}

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);

  if (process.env.START_WORKER !== 'false') {
    import('./jobs/pdfWorker.js').catch((err) => {
      console.error('Failed to start worker:', err);
    });
  }
});
