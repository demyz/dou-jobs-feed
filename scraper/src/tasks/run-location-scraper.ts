import { logger } from '@/core/logger/index';
import { jobLocationsService } from '@/modules/job-locations/job-locations.service';

async function main() {
  logger.info('Starting Location Scraper...');

  await jobLocationsService.runLocationScraper();

  logger.info('Location Scraper finished successfully');
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
  logger.fatal('Failed to start location scraper:', error);
  process.exit(1);
});

