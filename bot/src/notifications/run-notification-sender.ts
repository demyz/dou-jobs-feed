import { notificationsService } from './notifications.service.js';
import { logger } from '../shared/logger.js';

/**
 * Entry point for notification sender task
 */
async function main() {
  try {
    logger.info('='.repeat(50));
    logger.info('Notification Sender Task Started');
    logger.info('='.repeat(50));

    await notificationsService.sendNewJobNotifications();

    logger.info('='.repeat(50));
    logger.info('Notification Sender Task Completed Successfully');
    logger.info('='.repeat(50));

    process.exit(0);
  } catch (error) {
    logger.error('Notification sender task failed', { error });
    process.exit(1);
  }
}

main();


