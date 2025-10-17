import { logger } from '@/core/logger/index';
import { jobsService } from '@/modules/jobs/jobs.service';

async function main() {
  logger.info('Starting Jobs Scraper...');

  await jobsService.runJobsScraper();

  logger.info('Jobs Scraper finished successfully');
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
  logger.fatal('Failed to start jobs scraper:', error);
  process.exit(1);
});

