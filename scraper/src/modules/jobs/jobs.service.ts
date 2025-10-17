import Parser from 'rss-parser';
import { logger } from '@/core/logger/index';
import { prisma } from '@/core/database/index';
import type { RSSJobItem, ParsedJobData } from './jobs.types';
import type { JobCategory } from '@/shared/generated/prisma';

export class JobsService {
  private readonly parser: Parser;

  constructor() {
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
      },
    });
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
   * Extract company slug from URL
   * Example: https://jobs.dou.ua/companies/eleks/vacancies/328133/ -> eleks
   */
  extractCompanySlugFromUrl(url: string): string | null {
    const match = url.match(/\/companies\/([^/]+)\//);
    return match ? match[1] : null;
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
   * Extract company name from job title
   * Title format: "Job Title в Company Name, Location"
   */
  extractCompanyNameFromTitle(title: string): string {
    // Try to extract company name between " в " and ","
    const match = title.match(/ в (.+?)(?:,|$)/);
    if (match && match[1]) {
      return match[1].trim();
    }

    // Fallback: try to split by " в " and take the second part
    const parts = title.split(' в ');
    if (parts.length > 1) {
      // Remove location part if it contains comma
      const companyPart = parts[1].split(',')[0].trim();
      return companyPart;
    }

    return 'Unknown Company';
  }

  /**
   * Find or create company in database
   */
  async findOrCreateCompany(slug: string, name: string): Promise<string> {
    try {
      const company = await prisma.company.upsert({
        where: { slug },
        create: {
          slug,
          name,
        },
        update: {
          name, // Update name in case it changed
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
   * Parse RSS job item to structured data
   */
  parseJobItem(item: RSSJobItem): ParsedJobData | null {
    try {
      const cleanedUrl = this.cleanUrl(item.link);
      const douId = this.extractDouIdFromUrl(cleanedUrl);
      const companySlug = this.extractCompanySlugFromUrl(cleanedUrl);

      if (!douId) {
        logger.warn('Could not extract DOU ID from URL', { url: item.link });
        return null;
      }

      if (!companySlug) {
        logger.warn('Could not extract company slug from URL', { url: item.link });
        return null;
      }

      const companyName = this.extractCompanyNameFromTitle(item.title);
      const description = item.content || item.contentSnippet || '';

      // Parse published date
      let publishedAt: Date;
      if (item.isoDate) {
        publishedAt = new Date(item.isoDate);
      } else if (item.pubDate) {
        publishedAt = new Date(item.pubDate);
      } else {
        publishedAt = new Date();
      }

      return {
        douId,
        title: item.title,
        url: cleanedUrl,
        companySlug,
        companyName,
        description,
        publishedAt,
      };
    } catch (error) {
      logger.error('Failed to parse job item', { error, item });
      return null;
    }
  }

  /**
   * Save job to database (upsert by douId)
   */
  async saveJob(jobData: ParsedJobData, categoryId: string): Promise<void> {
    try {
      // Find or create company
      const companyId = await this.findOrCreateCompany(
        jobData.companySlug,
        jobData.companyName
      );

      // Upsert job
      await prisma.job.upsert({
        where: { douId: jobData.douId },
        create: {
          douId: jobData.douId,
          title: jobData.title,
          url: jobData.url,
          companyId,
          categoryId,
          description: jobData.description,
          publishedAt: jobData.publishedAt,
        },
        update: {
          title: jobData.title,
          url: jobData.url,
          description: jobData.description,
          publishedAt: jobData.publishedAt,
          // Update company and category in case they changed
          companyId,
          categoryId,
        },
      });

      logger.debug('Job saved successfully', { douId: jobData.douId });
    } catch (error) {
      logger.error('Failed to save job', { error, jobData });
      throw error;
    }
  }

  /**
   * Process single category: fetch RSS and save jobs
   */
  async processCategory(category: JobCategory): Promise<number> {
    try {
      logger.info('Processing category', {
        categoryName: category.name,
        categorySlug: category.slug
      });

      const items = await this.parseRSSFeed(category.rssUrl);
      logger.info('RSS items fetched', {
        categorySlug: category.slug,
        count: items.length
      });

      let savedCount = 0;
      let errorCount = 0;

      for (const item of items) {
        try {
          const jobData = this.parseJobItem(item);

          if (!jobData) {
            errorCount++;
            continue;
          }

          await this.saveJob(jobData, category.id);
          savedCount++;
        } catch (error) {
          errorCount++;
          logger.error('Failed to process job item', {
            error,
            categorySlug: category.slug,
            itemLink: item.link
          });
          // Continue processing other jobs
        }
      }

      logger.info('Category processing complete', {
        categorySlug: category.slug,
        totalItems: items.length,
        savedCount,
        errorCount,
      });

      return savedCount;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger.error('Failed to process category', {
        error: errorMessage,
        stack: errorStack,
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
    try {
      logger.info('Starting Jobs Scraper...');

      // Get all active categories
      const categories = await prisma.jobCategory.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });

      logger.info('Active categories found', { count: categories.length });

      if (categories.length === 0) {
        logger.warn('No active categories found. Nothing to scrape.');
        return;
      }

      let totalJobsScraped = 0;
      let categoriesProcessed = 0;
      let categoriesWithErrors = 0;

      for (const category of categories) {
        try {
          const jobsCount = await this.processCategory(category);
          totalJobsScraped += jobsCount;
          categoriesProcessed++;
        } catch (error) {
          categoriesWithErrors++;
          logger.error('Category processing failed, continuing with next', {
            categorySlug: category.slug,
            error,
          });
          // Continue with next category
        }
      }

      logger.info('Jobs Scraper completed', {
        totalCategories: categories.length,
        categoriesProcessed,
        categoriesWithErrors,
        totalJobsScraped,
      });
    } catch (error) {
      logger.error('Jobs scraper failed', { error });
      throw error;
    }
  }
}

export const jobsService = new JobsService();

