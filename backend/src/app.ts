import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Root welcome message
  app.get('/', (_req, res) => {
    res.json({ message: 'Welcome to the Ops Command Center API' });
  });

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', env: env.nodeEnv, time: new Date().toISOString() });
  });

  // Welcome message for /api
  app.get('/api', (_req, res) => {
    res.json({ message: 'Ops Command Center API is running!' });
  });

  // All application routes live under /api
  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
