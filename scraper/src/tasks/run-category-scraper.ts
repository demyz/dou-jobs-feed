import { logger } from '@/core/logger/index';
import { jobCategoriesService } from '@/modules/job-categories/job-categories.service';

async function main() {
  logger.info('Starting Category Scraper...');

  await jobCategoriesService.runCategoryScraper();

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

