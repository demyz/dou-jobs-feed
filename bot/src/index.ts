import { bot } from './bot/bot.js';
import { createApiServer } from './api/server.js';
import { config } from './shared/config.js';
import { logger } from './shared/logger.js';

/**
 * Main entry point - starts both Bot and API server
 */
async function main() {
  try {
    logger.info('='.repeat(50));
    logger.info('Starting DOU Jobs Bot Service');
    logger.info('='.repeat(50));

    // Start API server
    const app = createApiServer();
    app.listen(config.apiPort, () => {
      logger.info(`API server running on port ${config.apiPort}`);
      logger.info(`Web App URL: ${config.webAppUrl}`);
    });

    // Start bot (long polling)
    logger.info('Starting Telegram bot...');
    await bot.start();
    logger.info('Telegram bot started successfully');

    logger.info('='.repeat(50));
    logger.info('DOU Jobs Bot Service is running');
    logger.info('='.repeat(50));
  } catch (error) {
    logger.error('Failed to start service', { error });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await bot.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await bot.stop();
  process.exit(0);
});

main();


