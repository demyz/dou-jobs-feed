import express from 'express';
import cors from 'cors';
import { telegramAuthMiddleware } from './middleware/telegram-auth.js';
import { errorHandler } from './middleware/error-handler.js';
import categoriesRouter from './routes/categories.routes.js';
import locationsRouter from './routes/locations.routes.js';
import subscriptionsRouter from './routes/subscriptions.routes.js';
import jobsRouter from './routes/jobs.routes.js';
import { logger } from '../shared/logger.js';

/**
 * Create and configure Express API server
 */
export function createApiServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve static files (Web App)
  app.use(express.static('public'));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // API routes (protected by Telegram auth)
  app.use('/api', telegramAuthMiddleware);
  app.use('/api/categories', categoriesRouter);
  app.use('/api/locations', locationsRouter);
  app.use('/api/subscriptions', subscriptionsRouter);
  app.use('/api/jobs', jobsRouter);

  // Error handler (must be last)
  app.use(errorHandler);

  logger.info('API server configured');

  return app;
}


