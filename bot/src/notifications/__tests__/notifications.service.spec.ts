import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationsService } from '../notifications.service';
import { createMockBot } from '../../__tests__/mocks/bot.mock';
import { createMockPrismaClient } from '../../__tests__/mocks/prisma.mock';

describe('NotificationsService', () => {
  let notificationsService: NotificationsService;
  let mockBot: ReturnType<typeof createMockBot>;
  let mockPrisma: ReturnType<typeof createMockPrismaClient>;

  beforeEach(() => {
    mockBot = createMockBot();
    mockPrisma = createMockPrismaClient();
    notificationsService = new NotificationsService(mockBot, mockPrisma);
  });

  describe('filterJobsForUser', () => {
    it('should filter jobs based on user subscriptions', () => {
      const jobs = [
        {
          id: '1',
          categoryId: 'cat1',
          publishedAt: new Date('2024-01-02'),
          locations: [
            { locationId: 'loc1' },
            { locationId: 'loc2' },
          ],
        },
        {
          id: '2',
          categoryId: 'cat2',
          publishedAt: new Date('2024-01-03'),
          locations: [{ locationId: 'loc3' }],
        },
      ];

      const subscriptions = [
        {
          categoryId: 'cat1',
          locations: [{ locationId: 'loc1' }],
        },
      ];

      const lastNotificationSentAt = new Date('2024-01-01');

      // Access private method via type casting for testing
      const result = (notificationsService as any).filterJobsForUser(
        jobs,
        subscriptions,
        lastNotificationSentAt
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should return all jobs in category when no specific locations are subscribed', () => {
      const jobs = [
        {
          id: '1',
          categoryId: 'cat1',
          publishedAt: new Date('2024-01-02'),
          locations: [{ locationId: 'loc1' }],
        },
        {
          id: '2',
          categoryId: 'cat1',
          publishedAt: new Date('2024-01-03'),
          locations: [{ locationId: 'loc2' }],
        },
      ];

      const subscriptions = [
        {
          categoryId: 'cat1',
          locations: [], // No specific locations = all locations
        },
      ];

      const lastNotificationSentAt = new Date('2024-01-01');

      const result = (notificationsService as any).filterJobsForUser(
        jobs,
        subscriptions,
        lastNotificationSentAt
      );

      expect(result).toHaveLength(2);
    });

    it('should exclude jobs older than lastNotificationSentAt', () => {
      const jobs = [
        {
          id: '1',
          categoryId: 'cat1',
          publishedAt: new Date('2024-01-01'),
          locations: [{ locationId: 'loc1' }],
        },
        {
          id: '2',
          categoryId: 'cat1',
          publishedAt: new Date('2024-01-03'),
          locations: [{ locationId: 'loc1' }],
        },
      ];

      const subscriptions = [
        {
          categoryId: 'cat1',
          locations: [],
        },
      ];

      const lastNotificationSentAt = new Date('2024-01-02');

      const result = (notificationsService as any).filterJobsForUser(
        jobs,
        subscriptions,
        lastNotificationSentAt
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('should return empty array when no subscriptions match', () => {
      const jobs = [
        {
          id: '1',
          categoryId: 'cat1',
          publishedAt: new Date('2024-01-02'),
          locations: [{ locationId: 'loc1' }],
        },
      ];

      const subscriptions = [
        {
          categoryId: 'cat2', // Different category
          locations: [],
        },
      ];

      const lastNotificationSentAt = new Date('2024-01-01');

      const result = (notificationsService as any).filterJobsForUser(
        jobs,
        subscriptions,
        lastNotificationSentAt
      );

      expect(result).toHaveLength(0);
    });
  });

  describe('sendNewJobNotifications', () => {
    it('should exit early when no new jobs found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'user1',
        lastNotificationSentAt: new Date('2024-01-01'),
      });

      mockPrisma.job.findMany.mockResolvedValue([]);

      await notificationsService.sendNewJobNotifications();

      expect(mockPrisma.user.findMany).not.toHaveBeenCalled();
      expect(mockBot.api.sendMessage).not.toHaveBeenCalled();
    });

    it('should process users and jobs', async () => {
      const fromDate = new Date('2024-01-01');

      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'user1',
        lastNotificationSentAt: fromDate,
      });

      const mockJob = {
        id: 'job1',
        douId: 12345,
        title: 'Test Job',
        categoryId: 'cat1',
        publishedAt: new Date('2024-01-02'),
        category: { name: 'QA', id: 'cat1' },
        company: { name: 'Test Company', slug: 'test-company' },
        locations: [{ locationId: 'loc1', location: { name: 'Kyiv' } }],
      };

      mockPrisma.job.findMany.mockResolvedValue([mockJob]);

      const mockUser = {
        id: 'user1',
        telegramId: BigInt(123456789),
        lastNotificationSentAt: fromDate,
        subscriptions: [
          {
            categoryId: 'cat1',
            category: { id: 'cat1', name: 'QA' },
            locations: [],
          },
        ],
      };

      mockPrisma.user.findMany.mockResolvedValue([mockUser]);
      mockBot.api.sendMessage.mockResolvedValue({});
      mockPrisma.user.update.mockResolvedValue(mockUser);

      await notificationsService.sendNewJobNotifications();

      // Verify that data was fetched
      expect(mockPrisma.user.findFirst).toHaveBeenCalled();
      expect(mockPrisma.job.findMany).toHaveBeenCalled();
      expect(mockPrisma.user.findMany).toHaveBeenCalled();

      // User timestamp should be updated regardless
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });

    it('should handle errors gracefully and continue processing', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'user1',
        lastNotificationSentAt: new Date('2024-01-01'),
      });

      const mockJob = {
        id: 'job1',
        categoryId: 'cat1',
        publishedAt: new Date('2024-01-02'),
        category: { name: 'QA' },
        company: { name: 'Test Company' },
        locations: [],
      };

      mockPrisma.job.findMany.mockResolvedValue([mockJob]);

      const mockUser = {
        id: 'user1',
        telegramId: BigInt(123456789),
        lastNotificationSentAt: new Date('2024-01-01'),
        subscriptions: [{ categoryId: 'cat1', locations: [] }],
      };

      mockPrisma.user.findMany.mockResolvedValue([mockUser]);
      mockBot.api.sendMessage.mockRejectedValue(new Error('Send failed'));

      await notificationsService.sendNewJobNotifications();

      // Should still update user timestamp even if message failed
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });
  });
});

