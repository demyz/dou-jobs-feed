import { InlineKeyboard } from 'grammy';
import type { JobWithRelations } from '../types.js';
import { config } from '../../shared/config.js';

/**
 * Create inline keyboard for job message
 */
export function createJobKeyboard(job: JobWithRelations): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  // Details button - opens Web App
  keyboard.webApp(
    '📄 Details',
    `${config.webAppUrl}/#/job/${job.id}`
  );

  return keyboard;
}
