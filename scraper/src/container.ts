import { prisma } from '@/core/database/index';
import { PageScraperService } from './modules/jobs/page-scraper.service';
import { JobsService } from './modules/jobs/jobs.service';
import { JobCategoriesService } from './modules/job-categories/job-categories.service';
import { JobLocationsService } from './modules/job-locations/job-locations.service';

export interface ScraperContainer {
  pageScraperService: PageScraperService;
  jobsService: JobsService;
  jobCategoriesService: JobCategoriesService;
  jobLocationsService: JobLocationsService;
}

/**
 * Create DI container with all dependencies
 */
export function createScraperContainer(): ScraperContainer {
  const pageScraperService = new PageScraperService();
  const jobsService = new JobsService(pageScraperService, prisma);
  const jobCategoriesService = new JobCategoriesService(prisma);
  const jobLocationsService = new JobLocationsService(prisma);

  return {
    pageScraperService,
    jobsService,
    jobCategoriesService,
    jobLocationsService,
  };
}

