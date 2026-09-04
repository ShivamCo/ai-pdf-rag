import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { clerkAuthHandler } from './middlewares/auth.middleware.js';

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.ORIGIN_DEV === '*' || !env.ORIGIN_DEV) {
        return callback(null, true);
      }
      const allowed = [
        env.ORIGIN_DEV,
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
      ];
      if (allowed.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-user-id',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(clerkAuthHandler);

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API is running',
  });
});

app.use('/api', apiRouter);
app.use('/', apiRouter);

app.use(errorHandler);

export default app;
