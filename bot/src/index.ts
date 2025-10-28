import { createBotContainer } from './container.js';
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

    // Create DI container
    const container = createBotContainer();

    // Start API server
    const app = createApiServer();
    app.listen(config.apiPort, () => {
      logger.info(`API server running on port ${config.apiPort}`);
      logger.info(`Web App URL: ${config.webAppUrl}`);
    });

    // Start bot (long polling)
    logger.info('Starting Telegram bot...');
    await container.bot.start();
    logger.info('Telegram bot started successfully');

    logger.info('DOU Jobs Bot Service is running');
    logger.info('='.repeat(50));

    // Graceful shutdown handlers
    const shutdownHandler = async () => {
      logger.info('Shutting down gracefully...');
      await container.bot.stop();
      process.exit(0);
    };

    process.on('SIGINT', shutdownHandler);
    process.on('SIGTERM', shutdownHandler);
  } catch (error) {
    logger.error('Failed to start service', { error });
    process.exit(1);
  }
}

main();


