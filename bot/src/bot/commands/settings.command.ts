import type { BotContext } from '../types.js';
import { InlineKeyboard } from 'grammy';
import { config } from '../../shared/config.js';

/**
 * Handle /settings command
 */
export async function handleSettings(ctx: BotContext) {
  const keyboard = new InlineKeyboard().webApp(
    '⚙️ Manage Subscriptions',
    `${config.webAppUrl}/#/settings`
  );

  await ctx.reply('Click the button below to manage your subscriptions:', {
    reply_markup: keyboard,
  });
}


