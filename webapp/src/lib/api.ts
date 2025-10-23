import { getTelegramInitData } from './telegram';
import type { Category, Location, Subscription, Job } from './types';

const API_BASE_URL = '/api';

/**
 * API Response type
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const initData = getTelegramInitData();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Telegram-Init-Data': initData,
      ...options.headers,
    },
  });

  const result: ApiResponse<T> = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'API request failed');
  }

  return result.data as T;
}

/**
 * Get all categories
 */
export async function getCategories(): Promise<Category[]> {
  return apiRequest<Category[]>('/categories');
}

/**
 * Get all locations
 */
export async function getLocations(): Promise<Location[]> {
  return apiRequest<Location[]>('/locations');
}

/**
 * Get user's subscriptions
 */
export async function getSubscriptions(): Promise<Subscription[]> {
  return apiRequest<Subscription[]>('/subscriptions');
}

/**
 * Save user's subscriptions
 */
export async function saveSubscriptions(
  subscriptions: Array<{ categoryId: string; locationIds: string[] }>
): Promise<void> {
  return apiRequest<void>('/subscriptions', {
    method: 'POST',
    body: JSON.stringify({ subscriptions }),
  });
}

/**
 * Get job by ID
 */
export async function getJob(jobId: string): Promise<Job> {
  return apiRequest<Job>(`/jobs/${jobId}`);
}


