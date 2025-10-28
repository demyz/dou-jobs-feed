import type { Bot } from 'grammy';
import type { BotContext } from './types.js';
import { handleStart } from './commands/start.command.js';
import { handleSettings } from './commands/settings.command.js';

/**
 * Register bot commands and handlers
 */
export function registerBotCommands(bot: Bot<BotContext>): void {
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
}


