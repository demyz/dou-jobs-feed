import { Bot } from 'grammy';
import type { BotContext } from './types.js';
import { config } from '../shared/config.js';
import { logger } from '../shared/logger.js';
import { handleStart } from './commands/start.command.js';
import { handleSettings } from './commands/settings.command.js';

// Create bot instance
export const bot = new Bot<BotContext>(config.botToken);

// Error handling
bot.catch((err) => {
  logger.error('Bot error occurred', {
    error: err.error,
    ctx: err.ctx,
  });
});

// Register commands
bot.command('start', handleStart);
bot.command('settings', handleSettings);

// Handle unknown commands
bot.on('message:text', async (ctx) => {
  if (ctx.message.text.startsWith('/')) {
    await ctx.reply(
      'Unknown command. Available commands:\n' +
        '/start - Start bot\n' +
        '/settings - Manage subscriptions'
    );
  }
});

logger.info('Bot initialized successfully');


