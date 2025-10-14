import { logger } from '@/core/logger/index';

async function main() {
  logger.info('Starting...');

  // TODO: Initialize scraper service
  console.log('Scraper is ready to start.');
}

// Handle uncaught exceptions
process.on('uncaughtException', (error: any) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any, promise: any) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
  process.exit(1);
});

main().catch((error: any) => {
  logger.fatal('Failed to start scraper:', error);
  process.exit(1);
});
