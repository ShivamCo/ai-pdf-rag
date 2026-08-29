import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { clerkAuthHandler } from './middlewares/auth.middleware.js';

const app = express();

// Middlewares
app.use(
  cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attach Clerk Auth Handler to parse JWT session tokens
app.use(clerkAuthHandler);

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'AI PDF RAG API Server is running!',
  });
});

// API Routes
app.use('/api', apiRouter);

// Fallback direct mounts for backward compatibility
app.use('/', apiRouter);

// Global Error Handler
app.use(errorHandler);

export default app;
