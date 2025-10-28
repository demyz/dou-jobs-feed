import { logger } from '@/core/logger/index';
import { createScraperContainer } from '@/container';

async function main() {
  logger.info('Starting Category Scraper...');

  const container = createScraperContainer();
  await container.jobCategoriesService.runCategoryScraper();

  logger.info('Category Scraper finished successfully');
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
  logger.fatal('Failed to start category scraper:', error);
  process.exit(1);
});

