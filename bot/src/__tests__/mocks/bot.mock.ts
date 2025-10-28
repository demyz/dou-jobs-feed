import { vi } from 'vitest';
import type { Bot } from 'grammy';
import type { BotContext } from '../../bot/types.js';

/**
 * Create mock Grammy Bot for testing
 */
export function createMockBot(): Bot<BotContext> {
  return {
    api: {
      sendMessage: vi.fn(),
      deleteMessage: vi.fn(),
      editMessageText: vi.fn(),
      answerCallbackQuery: vi.fn(),
    },
    start: vi.fn(),
    stop: vi.fn(),
    command: vi.fn(),
    on: vi.fn(),
    catch: vi.fn(),
  } as any;
}

