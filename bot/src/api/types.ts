import type { Request } from 'express';

// Extended Express Request with Telegram user data
export interface TelegramRequest extends Request {
  telegramUser?: {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    language_code?: string;
  };
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Subscription request body
export interface SubscriptionRequest {
  subscriptions: Array<{
    categoryId: string;
    locationIds: string[]; // empty array = all locations
  }>;
}


