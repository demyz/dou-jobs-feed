import Parser from 'rss-parser';
import type { PrismaClient } from '@repo/database';
import { logger } from '@/core/logger/index';
import type { PageScraperService } from './page-scraper.service';
import type { RSSJobItem, ParsedJobData } from './jobs.types';
import type { JobCategory } from '@repo/database';

interface ProcessingStats {
  totalJobsProcessed: number;
  totalJobsAdded: number;
  totalJobsUpdated: number;
  totalErrors: number;
  categoriesProcessed: number;
}

export class JobsService {
  private readonly parser: Parser;
  private readonly globalRssUrl = 'https://jobs.dou.ua/vacancies/feeds/';

  constructor(
    private readonly pageScraperService: PageScraperService,
    private readonly prisma: PrismaClient
  ) {
    this.parser = new Parser({
      customFields: {
        item: [
          ['content:encoded', 'content'],
          ['description', 'contentSnippet'],
        ],
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
      },
    });
  }

  /**
   * Extract error message from unknown error type
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Unknown error';
  }

  /**
   * Parse RSS feed and return job items
   */
  async parseRSSFeed(rssUrl: string): Promise<RSSJobItem[]> {
    try {
      logger.debug('Parsing RSS feed', { rssUrl });
      const feed = await this.parser.parseURL(rssUrl);
      return feed.items as RSSJobItem[];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger.error('Failed to parse RSS feed', {
        error: errorMessage,
        stack: errorStack,
        rssUrl
      });
      throw error;
    }
  }

  /**
   * Extract DOU job ID from URL
   * Example: https://jobs.dou.ua/companies/eleks/vacancies/328133/ -> 328133
   */
  extractDouIdFromUrl(url: string): number | null {
    const match = url.match(/\/vacancies\/(\d+)\//);
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * Clean URL by removing query parameters
   * Example: https://example.com/path?utm_source=test -> https://example.com/path
   */
  cleanUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.origin}${urlObj.pathname}`;
    } catch (error) {
      logger.warn('Failed to parse URL', { url, error });
      return url;
    }
  }

  /**
   * Check if there are new jobs in global RSS feed
   * Returns true if new jobs exist, false otherwise
   */
  async checkForNewJobs(): Promise<boolean> {
    try {
      logger.info('Checking for new jobs in global RSS feed');

      const items = await this.parseRSSFeed(this.globalRssUrl);

      if (items.length === 0) {
        logger.info('No jobs found in global RSS feed');
        return false;
      }

      // Find max douId across all items in the feed
      const feedDouIds = items
        .map((item) => {
          const cleanedUrl = this.cleanUrl(item.link);
          return this.extractDouIdFromUrl(cleanedUrl);
        })
        .filter((id): id is number => typeof id === 'number');

      if (feedDouIds.length === 0) {
        logger.warn('Could not extract any douId from RSS items');
        return true; // Assume there are new jobs if we can't parse
      }

      const maxFeedDouId = Math.max(...feedDouIds);

      // Get max douId from database
      const maxDouIdResult = await this.prisma.job.findFirst({
        select: { douId: true },
        orderBy: { douId: 'desc' },
      });

      const maxDouId = maxDouIdResult?.douId || 0;

      logger.info('Global RSS check result', {
        maxFeedDouId,
        maxDouId,
        hasNewJobs: maxFeedDouId > maxDouId,
      });

      return maxFeedDouId > maxDouId;
    } catch (error) {
      logger.error('Failed to check for new jobs', { error });
      // Return true to continue processing in case of error
      return true;
    }
  }

  /**
   * Get all active categories from database
   */
  async getActiveCategories(): Promise<JobCategory[]> {
    try {
      const categories = await this.prisma.jobCategory.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });

      logger.info('Active categories found', { count: categories.length });
      return categories;
    } catch (error) {
      logger.error('Failed to get active categories', { error });
      throw error;
    }
  }

  /**
   * Get unprocessed jobs for a specific category
   * Returns jobs where douId > max douId in database
   */
  async getUnprocessedJobsForCategory(category: JobCategory): Promise<RSSJobItem[]> {
    try {
      // Get max douId from database (globally)
      const maxDouIdResult = await this.prisma.job.findFirst({
        select: { douId: true },
        orderBy: { douId: 'desc' },
      });
      const lastProcessedDouId = maxDouIdResult?.douId || 0;

      logger.debug('Fetching RSS for category', {
        categorySlug: category.slug,
        lastProcessedDouId,
      });

      const items = await this.parseRSSFeed(category.rssUrl);

      // Filter jobs based on global lastProcessedDouId
      const unprocessedJobs = items.filter(item => {
        const cleanedUrl = this.cleanUrl(item.link);
        const douId = this.extractDouIdFromUrl(cleanedUrl);

        if (!douId) return false;

        // Only include jobs with douId greater than lastProcessedDouId
        return douId > lastProcessedDouId;
      });

      logger.info('Unprocessed jobs found for category', {
        categorySlug: category.slug,
        totalJobs: items.length,
        unprocessedJobs: unprocessedJobs.length,
        lastProcessedDouId,
      });

      return unprocessedJobs;
    } catch (error) {
      logger.error('Failed to get unprocessed jobs for category', {
        error,
        categorySlug: category.slug,
      });
      throw error;
    }
  }

  /**
   * Scrape job details from job page
   */
  async scrapeJobDetails(rssItem: RSSJobItem): Promise<ParsedJobData | null> {
    try {
      const cleanedUrl = this.cleanUrl(rssItem.link);
      const douId = this.extractDouIdFromUrl(cleanedUrl);

      if (!douId) {
        logger.warn('Could not extract DOU ID from URL', { url: rssItem.link });
        return null;
      }

      // Parse published date
      let publishedAt: Date;
      if (rssItem.isoDate) {
        publishedAt = new Date(rssItem.isoDate);
      } else if (rssItem.pubDate) {
        publishedAt = new Date(rssItem.pubDate);
      } else {
        publishedAt = new Date();
      }

      // Get short description from RSS
      const description = rssItem.content || rssItem.contentSnippet || '';

      // Scrape full details from job page
      const pageData = await this.pageScraperService.scrapeJobPage(cleanedUrl);

      return {
        douId,
        title: pageData.title,
        url: cleanedUrl,
        companySlug: pageData.companySlug,
        companyName: pageData.companyName,
        companyLogoUrl: pageData.companyLogoUrl,
        description,
        fullDescription: pageData.fullDescription,
        locations: pageData.locations,
        salary: pageData.salary,
        publishedAt,
      };
    } catch (error) {
      logger.error('Failed to scrape job details', { error, rssItemLink: rssItem.link });
      return null;
    }
  }

  /**
   * Find or create company in database
   */
  async findOrCreateCompany(slug: string, name: string, logoUrl?: string): Promise<string> {
    try {
      const company = await this.prisma.company.upsert({
        where: { slug },
        create: {
          slug,
          name,
          logoUrl,
        },
        update: {
          name, // Update name in case it changed
          logoUrl, // Update logo URL in case it changed
        },
        select: {
          id: true,
        },
      });

      return company.id;
    } catch (error) {
      logger.error('Failed to find or create company', { error, slug, name });
      throw error;
    }
  }

  /**
   * Find or create location by name
   * If location doesn't exist, create it with source 'job_parser'
   */
  async findOrCreateLocation(locationName: string): Promise<string> {
    try {
      // Create a simple slug from location name
      const slug = locationName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      const location = await this.prisma.location.upsert({
        where: { slug },
        create: {
          name: locationName,
          slug,
          source: 'job_parser',
          isActive: true,
        },
        update: {
          name: locationName, // Update name if changed
        },
        select: {
          id: true,
        },
      });

      return location.id;
    } catch (error) {
      logger.error('Failed to find or create location', { error, locationName });
      throw error;
    }
  }

  /**
   * Save job with all details to database
   * Returns true if job was created (added), false if it was updated
   */
  async saveJobWithDetails(jobData: ParsedJobData, categoryId: string): Promise<boolean> {
    try {
      // Find or create company
      const companyId = await this.findOrCreateCompany(
        jobData.companySlug,
        jobData.companyName,
        jobData.companyLogoUrl
      );

      // Check if job already exists
      const existingJob = await this.prisma.job.findUnique({
        where: { douId: jobData.douId },
        select: { id: true },
      });

      const isNewJob = !existingJob;

      // Upsert job
      const job = await this.prisma.job.upsert({
        where: { douId: jobData.douId },
        create: {
          douId: jobData.douId,
          title: jobData.title,
          url: jobData.url,
          companyId,
          categoryId,
          description: jobData.description,
          fullDescription: jobData.fullDescription,
          salary: jobData.salary,
          publishedAt: jobData.publishedAt,
        },
        update: {
          title: jobData.title,
          url: jobData.url,
          description: jobData.description,
          fullDescription: jobData.fullDescription,
          salary: jobData.salary,
          publishedAt: jobData.publishedAt,
          // Update company and category in case they changed
          companyId,
          categoryId,
        },
        select: {
          id: true,
        },
      });

      // Handle locations if provided
      if (jobData.locations && jobData.locations.length > 0) {
        // Delete existing job-location relationships
        await this.prisma.jobLocation.deleteMany({
          where: { jobId: job.id },
        });

        // Create new job-location relationships
        for (const locationName of jobData.locations) {
          try {
            const locationId = await this.findOrCreateLocation(locationName);

            await this.prisma.jobLocation.create({
              data: {
                jobId: job.id,
                locationId,
              },
            });
          } catch (error) {
            logger.error('Failed to create job-location relationship', {
              error,
              jobId: job.id,
              locationName,
            });
            // Continue with other locations
          }
        }
      }

      logger.debug(`Job ${isNewJob ? 'added' : 'updated'}`, {
        douId: jobData.douId,
        title: jobData.title,
      });

      return isNewJob;
    } catch (error) {
      logger.error('Failed to save job with details', { error, jobData });
      throw error;
    }
  }

  /**
   * Process a single category: get unprocessed jobs and save them
   */
  async processCategory(
    category: JobCategory,
    stats: ProcessingStats
  ): Promise<number> {
    try {
      logger.info('Processing category', {
        categoryName: category.name,
        categorySlug: category.slug
      });

      const unprocessedJobs = await this.getUnprocessedJobsForCategory(category);

      if (unprocessedJobs.length === 0) {
        logger.info('No unprocessed jobs for category', { categorySlug: category.slug });
        return 0;
      }

      let categoryJobsAdded = 0;
      let categoryJobsUpdated = 0;

      for (const rssItem of unprocessedJobs) {
        try {
          stats.totalJobsProcessed++;

          const jobData = await this.scrapeJobDetails(rssItem);

          if (!jobData) {
            stats.totalErrors++;
            continue;
          }

          const isNewJob = await this.saveJobWithDetails(jobData, category.id);

          if (isNewJob) {
            stats.totalJobsAdded++;
            categoryJobsAdded++;
          } else {
            stats.totalJobsUpdated++;
            categoryJobsUpdated++;
          }
        } catch (error) {
          stats.totalErrors++;
          logger.error('Failed to process job item', {
            error,
            categorySlug: category.slug,
            itemLink: rssItem.link
          });
          // Continue processing other jobs
        }
      }

      logger.info('Category processing complete', {
        categorySlug: category.slug,
        totalProcessed: unprocessedJobs.length,
        added: categoryJobsAdded,
        updated: categoryJobsUpdated,
      });

      stats.categoriesProcessed++;
      return unprocessedJobs.length;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to process category', {
        error: errorMessage,
        categoryId: category.id,
        categorySlug: category.slug
      });
      throw error;
    }
  }

  /**
   * Run the complete jobs scraping process
   */
  async runJobsScraper(): Promise<void> {
    const startTime = Date.now();
    let sessionId: string | undefined;
    let sessionStatus: 'success' | 'failed' | 'partial' = 'success';
    let errorDetails: string | undefined;

    try {
      logger.info('Starting Jobs Scraper...');

      // Create scraper session
      const session = await this.prisma.scraperSession.create({
        data: {
          status: 'in_progress',
        },
      });
      sessionId = session.id;

      // Check for new jobs in global RSS feed
      const hasNewJobs = await this.checkForNewJobs();

      if (!hasNewJobs) {
        logger.info('No new jobs found. Exiting early.');

        // Update session
        await this.prisma.scraperSession.update({
          where: { id: sessionId },
          data: {
            status: 'success',
            completedAt: new Date(),
            durationMs: Date.now() - startTime,
          },
        });

        return;
      }

      // Get all active categories
      const categories = await this.getActiveCategories();

      if (categories.length === 0) {
        logger.warn('No active categories found. Nothing to scrape.');

        // Update session
        await this.prisma.scraperSession.update({
          where: { id: sessionId },
          data: {
            status: 'success',
            completedAt: new Date(),
            durationMs: Date.now() - startTime,
          },
        });

        return;
      }

      const stats: ProcessingStats = {
        totalJobsProcessed: 0,
        totalJobsAdded: 0,
        totalJobsUpdated: 0,
        totalErrors: 0,
        categoriesProcessed: 0,
      };

      // Process each category
      for (const category of categories) {
        try {
          await this.processCategory(category, stats);
        } catch (error) {
          sessionStatus = 'partial';
          const errorMsg = this.getErrorMessage(error);
          errorDetails = errorDetails
            ? `${errorDetails}\n${category.slug}: ${errorMsg}`
            : `${category.slug}: ${errorMsg}`;

          logger.error('Category processing failed, continuing with next', {
            categorySlug: category.slug,
            error: errorMsg,
          });
          // Continue with next category
        }
      }

      // Determine final status
      if (stats.totalErrors > 0 && stats.totalJobsAdded === 0 && stats.totalJobsUpdated === 0) {
        sessionStatus = 'failed';
      } else if (stats.totalErrors > 0) {
        sessionStatus = 'partial';
      }

      // Get highest douId processed
      const maxDouIdResult = await this.prisma.job.findFirst({
        select: { douId: true },
        orderBy: { douId: 'desc' },
      });

      // Update session with final stats
      await this.prisma.scraperSession.update({
        where: { id: sessionId },
        data: {
          status: sessionStatus,
          lastProcessedDouId: maxDouIdResult?.douId,
          totalJobsProcessed: stats.totalJobsProcessed,
          totalJobsAdded: stats.totalJobsAdded,
          totalJobsUpdated: stats.totalJobsUpdated,
          totalErrors: stats.totalErrors,
          categoriesProcessed: stats.categoriesProcessed,
          completedAt: new Date(),
          durationMs: Date.now() - startTime,
          errorDetails,
        },
      });

      logger.info('Jobs Scraper completed', {
        status: sessionStatus,
        totalCategories: categories.length,
        categoriesProcessed: stats.categoriesProcessed,
        totalJobsProcessed: stats.totalJobsProcessed,
        totalJobsAdded: stats.totalJobsAdded,
        totalJobsUpdated: stats.totalJobsUpdated,
        totalErrors: stats.totalErrors,
        durationMs: Date.now() - startTime,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Jobs scraper failed', { error: errorMessage });

      // Update session with failure status
      if (sessionId) {
        await this.prisma.scraperSession.update({
          where: { id: sessionId },
          data: {
            status: 'failed',
            errorDetails: errorMessage,
            completedAt: new Date(),
            durationMs: Date.now() - startTime,
          },
        });
      }

      throw error;
    }
  }
}
