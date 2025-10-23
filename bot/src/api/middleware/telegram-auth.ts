import type { Response, NextFunction } from 'express';
import type { TelegramRequest } from '../types.js';
import crypto from 'crypto';
import { config } from '../../shared/config.js';
import { logger } from '../../shared/logger.js';

/**
 * Validate Telegram WebApp initData
 * Reference: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function telegramAuthMiddleware(
  req: TelegramRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const initData = req.headers['x-telegram-init-data'] as string;

    if (!initData) {
      logger.warn('Missing x-telegram-init-data header');
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    // Validate initData
    const isValid = validateTelegramData(initData, config.botToken);

    if (!isValid) {
      logger.warn('Invalid Telegram initData');
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    // Parse user data
    const user = parseUserFromInitData(initData);

    if (!user) {
      logger.warn('Unable to parse user from initData');
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    // Attach user to request
    req.telegramUser = user;

    next();
  } catch (error) {
    logger.error('Error in Telegram auth middleware', { error });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

/**
 * Validate Telegram WebApp data using HMAC-SHA256
 */
function validateTelegramData(initData: string, botToken: string): boolean {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');

    if (!hash) return false;

    // Sort parameters alphabetically
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Create secret key
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // Calculate hash
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    return calculatedHash === hash;
  } catch (error) {
    logger.error('Error validating Telegram data', { error });
    return false;
  }
}

/**
 * Parse user data from initData
 */
function parseUserFromInitData(
  initData: string
): TelegramRequest['telegramUser'] | null {
  try {
    const urlParams = new URLSearchParams(initData);
    const userParam = urlParams.get('user');

    if (!userParam) return null;

    const user = JSON.parse(userParam);

    return {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      language_code: user.language_code,
    };
  } catch (error) {
    logger.error('Error parsing user from initData', { error });
    return null;
  }
}


