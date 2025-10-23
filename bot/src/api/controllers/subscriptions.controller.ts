import type { Response } from 'express';
import type { TelegramRequest, SubscriptionRequest } from '../types.js';
import { prisma } from '@repo/database';
import { logger } from '../../shared/logger.js';

/**
 * Get user's subscriptions
 */
export async function getSubscriptions(req: TelegramRequest, res: Response) {
  try {
    if (!req.telegramUser) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(req.telegramUser.id) },
      include: {
        subscriptions: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            locations: {
              include: {
                location: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    // Transform subscriptions for easier frontend consumption
    const subscriptions = user.subscriptions.map((sub) => ({
      categoryId: sub.categoryId,
      category: sub.category,
      locations: sub.locations.map((sl) => sl.location),
    }));

    res.json({ success: true, data: subscriptions });
  } catch (error) {
    logger.error('Error fetching subscriptions', { error });
    res.status(500).json({ success: false, error: 'Failed to fetch subscriptions' });
  }
}

/**
 * Save user's subscriptions
 */
export async function saveSubscriptions(req: TelegramRequest, res: Response) {
  try {
    if (!req.telegramUser) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { subscriptions } = req.body as SubscriptionRequest;

    if (!Array.isArray(subscriptions)) {
      res.status(400).json({ success: false, error: 'Invalid request body' });
      return;
    }

    // Find or create user
    const user = await prisma.user.upsert({
      where: { telegramId: BigInt(req.telegramUser.id) },
      create: {
        telegramId: BigInt(req.telegramUser.id),
        username: req.telegramUser.username,
        firstName: req.telegramUser.first_name,
        lastName: req.telegramUser.last_name,
        languageCode: req.telegramUser.language_code,
      },
      update: {
        username: req.telegramUser.username,
        firstName: req.telegramUser.first_name,
        lastName: req.telegramUser.last_name,
        languageCode: req.telegramUser.language_code,
      },
    });

    // Delete all existing subscriptions
    await prisma.userSubscription.deleteMany({
      where: { userId: user.id },
    });

    // Create new subscriptions
    for (const sub of subscriptions) {
      const categorySubscription = await prisma.userSubscription.create({
        data: {
          userId: user.id,
          categoryId: sub.categoryId,
        },
      });

      // Create location subscriptions if specified
      if (sub.locationIds.length > 0) {
        await prisma.userLocationSubscription.createMany({
          data: sub.locationIds.map((locationId) => ({
            categorySubscriptionId: categorySubscription.id,
            locationId,
          })),
        });
      }
    }

    logger.info('Subscriptions saved', {
      userId: user.id,
      subscriptionsCount: subscriptions.length,
    });

    res.json({ success: true });
  } catch (error) {
    logger.error('Error saving subscriptions', { error });
    res.status(500).json({ success: false, error: 'Failed to save subscriptions' });
  }
}


