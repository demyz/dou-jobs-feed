import { Bot } from 'grammy';
import type { BotContext } from './bot/types.js';
import { registerBotCommands } from './bot/bot.js';
import { config } from './shared/config.js';
import { logger } from './shared/logger.js';
import { prisma } from '@repo/database';
import { NotificationsService } from './notifications/notifications.service.js';

export interface BotContainer {
  bot: Bot<BotContext>;
  notificationsService: NotificationsService;
}

/**
 * Create and configure bot instance
 */
export function createBot(token: string): Bot<BotContext> {
  const bot = new Bot<BotContext>(token);

  // Error handling
  bot.catch((err) => {
    logger.error('Bot error occurred', {
      error: err.error,
      ctx: err.ctx,
    });
  });

  // Register commands
  registerBotCommands(bot);

  logger.info('Bot initialized successfully');

  return bot;
}

/**
 * Create DI container with all dependencies
 */
export function createBotContainer(): BotContainer {
  const bot = createBot(config.botToken);
  const notificationsService = new NotificationsService(bot, prisma);

  return {
    bot,
    notificationsService,
  };
}

