import type { BotContext } from '../types.js';
import { prisma } from '@repo/database';
import { logger } from '../../shared/logger.js';
import { InlineKeyboard } from 'grammy';
import { config } from '../../shared/config.js';

/**
 * Handle /start command
 */
export async function handleStart(ctx: BotContext) {
  try {
    const from = ctx.from;
    if (!from) {
      await ctx.reply('Unable to identify user.');
      return;
    }

    // Upsert user in database
    await prisma.user.upsert({
      where: { telegramId: BigInt(from.id) },
      create: {
        telegramId: BigInt(from.id),
        username: from.username,
        firstName: from.first_name,
        lastName: from.last_name,
        languageCode: from.language_code,
        isBot: from.is_bot,
        lastSeenAt: new Date(),
      },
      update: {
        username: from.username,
        firstName: from.first_name,
        lastName: from.last_name,
        languageCode: from.language_code,
        lastSeenAt: new Date(),
      },
    });

    logger.info('User registered/updated', {
      telegramId: from.id,
      username: from.username,
    });

    // Welcome message with settings button
    const keyboard = new InlineKeyboard().webApp(
      '⚙️ Manage Subscriptions',
      `${config.webAppUrl}/#/settings`
    );

    await ctx.reply(
      `👋 Welcome to DOU Jobs Bot!

I'll help you stay updated with the latest job postings from jobs.dou.ua.

Use the button below to manage your subscriptions and start receiving job notifications.

Available commands:
/settings - Manage your subscriptions`,
      { reply_markup: keyboard }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error('Error in /start command', {
      error: errorMessage,
      stack: errorStack,
    });
    await ctx.reply('An error occurred. Please try again later.');
  }
}


