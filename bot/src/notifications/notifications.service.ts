import { prisma } from '@repo/database';
import { bot } from '../bot/bot.js';
import { formatJobMessage } from '../bot/formatters/job.formatter.js';
import { createJobKeyboard } from '../bot/keyboards/job.keyboard.js';
import { logger } from '../shared/logger.js';
import type { JobWithRelations } from '../bot/types.js';

export class NotificationsService {
  private readonly sendMessageSleepMs = 50;

  /**
   * Send new job notifications to all subscribed users
   */
  async sendNewJobNotifications() {
    logger.info('Starting notification sender...');

    try {
      // 1. Get oldest check timestamp among all users with subscriptions
      const oldestUser = await prisma.user.findFirst({
        where: {
          subscriptions: {
            some: {}, // has at least one subscription
          },
        },
        orderBy: {
          lastNotificationSentAt: 'asc',
        },
      });

      const fromDate = oldestUser?.lastNotificationSentAt || new Date(0);

      logger.info('Fetching new jobs', { fromDate });

      // 2. Fetch all new jobs in one query
      const newJobs = await prisma.job.findMany({
        where: {
          publishedAt: {
            gt: fromDate,
          },
        },
        include: {
          category: true,
          company: true,
          locations: {
            include: {
              location: true,
            },
          },
        },
        orderBy: {
          publishedAt: 'asc',
        },
      });

      logger.info(`Found ${newJobs.length} new jobs since ${fromDate}`);

      if (newJobs.length === 0) {
        logger.info('No new jobs to send');
        return;
      }

      // 3. Get all users with subscriptions
      const users = await prisma.user.findMany({
        where: {
          subscriptions: {
            some: {},
          },
        },
        include: {
          subscriptions: {
            include: {
              category: true,
              locations: {
                include: {
                  location: true,
                },
              },
            },
          },
        },
      });

      logger.info(`Processing notifications for ${users.length} users`);

      let totalSent = 0;
      let totalErrors = 0;

      // 4. Process each user
      for (const user of users) {
        try {
          // Filter jobs for this user based on subscriptions
          const userJobs = this.filterJobsForUser(
            newJobs,
            user.subscriptions,
            user.lastNotificationSentAt
          );

          if (userJobs.length === 0) {
            logger.debug('No jobs for user', {
              telegramId: user.telegramId.toString(),
            });
            continue;
          }

          logger.info(`Sending ${userJobs.length} jobs to user`, {
            telegramId: user.telegramId.toString(),
          });

          // Send jobs to user with rate limiting
          for (const job of userJobs) {
            try {
              const message = formatJobMessage(job as JobWithRelations);
              const keyboard = createJobKeyboard(job as JobWithRelations);

              await bot.api.sendMessage(Number(user.telegramId), message, {
                parse_mode: 'HTML',
                reply_markup: keyboard,
                link_preview_options: { is_disabled: true },
              });

              totalSent++;

              // Rate limiting: ~20 msg/sec to be safe (Telegram allows ~30/sec)
              await this.sleep(this.sendMessageSleepMs);
            } catch (error) {
              logger.error('Failed to send job to user', {
                userId: user.id,
                jobId: job.id,
                error,
              });
              totalErrors++;
            }
          }

          // Update last notification time for user
          await prisma.user.update({
            where: { id: user.id },
            data: { lastNotificationSentAt: new Date() },
          });

          logger.info('User notifications completed', {
            telegramId: user.telegramId.toString(),
            jobsSent: userJobs.length,
          });
        } catch (error) {
          logger.error('Failed to process user', {
            userId: user.id,
            error,
          });
          totalErrors++;
        }
      }

      logger.info('Notification sender completed', {
        totalUsers: users.length,
        totalSent,
        totalErrors,
      });
    } catch (error) {
      logger.error('Notification sender failed', { error });
      throw error;
    }
  }

  /**
   * Filter jobs for user based on their subscriptions
   */
  private filterJobsForUser(
    jobs: any[],
    subscriptions: any[],
    lastNotificationSentAt: Date | null
  ): any[] {
    return jobs.filter((job) => {
      // Check if job is newer than user's last check
      if (lastNotificationSentAt && job.publishedAt <= lastNotificationSentAt) {
        return false;
      }

      // Find subscription for this job's category
      const subscription = subscriptions.find(
        (sub) => sub.categoryId === job.categoryId
      );

      if (!subscription) {
        return false;
      }

      // If no specific locations are subscribed, accept all jobs in this category
      if (subscription.locations.length === 0) {
        return true;
      }

      // Check if job has any of the subscribed locations
      const jobLocationIds = job.locations.map((jl: any) => jl.locationId);
      const subLocationIds = subscription.locations.map((sl: any) => sl.locationId);

      return jobLocationIds.some((id: string) => subLocationIds.includes(id));
    });
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const notificationsService = new NotificationsService();


