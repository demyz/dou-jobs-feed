import { logger } from '@/core/logger/index';
import { runCategoryScraper } from '@/tasks/scrap-categories';

async function main() {
  logger.info('Starting DOU Jobs Scraper...');

  // Run category scraper
  await runCategoryScraper();

  logger.info('Scraper finished successfully');
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
