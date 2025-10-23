import type { Context } from 'grammy';
import type { Job, Company, JobCategory, Location } from '@repo/database';

// Extended context with custom properties
export interface BotContext extends Context {
  // Add custom properties if needed
}

// Job with relations for display
export interface JobWithRelations extends Job {
  company: Company;
  category: JobCategory;
  locations: Array<{
    location: Location;
  }>;
}


