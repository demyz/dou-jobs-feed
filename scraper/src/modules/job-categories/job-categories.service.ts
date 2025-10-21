import axios from 'axios';
import * as cheerio from 'cheerio';
import { logger } from '@/core/logger/index';
import { config } from '@/config/index';
import { prisma } from '@/core/database/index';

interface Category {
  name: string;
  slug: string;
  url: string;
  rssUrl: string;
}

export class JobCategoriesService {
  private readonly baseUrl: string;
  private readonly userAgent: string;
  private readonly selector: string;

  constructor() {
    this.baseUrl = config.baseUrl;
    this.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    this.selector = '.b-jobs-search select[name=category] option';
  }

  async scrapCategories(): Promise<Category[]> {
    try {
      logger.info('Fetching categories from DOU.ua', { baseUrl: this.baseUrl });

      const response = await axios.get(`${this.baseUrl}/`, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
          'Cookie': 'lang=en',
        }
      });

      const $ = cheerio.load(response.data);

      const categories: Category[] = [];

      $(this.selector).each((_index, element) => {
        const $option = $(element);
        const slug = $option.attr('value');
        const name = $option.text().trim();

        if (slug && name) {
          const url = `${this.baseUrl}/vacancies/?category=${encodeURIComponent(slug)}`;
          const rssUrl = `${this.baseUrl}/vacancies/feeds/?category=${encodeURIComponent(slug)}`;

          categories.push({
            name,
            slug,
            url,
            rssUrl,
          });
        }
      });

      logger.info('Successfully scraped categories', { count: categories.length });

      return categories;
    } catch (error) {
      logger.error('Failed to scrape categories', { error, baseUrl: this.baseUrl });
      throw error;
    }
  }

  async saveCategoriesToDatabase(categories: Category[]): Promise<void> {
    let createdCount = 0;
    let updatedCount = 0;

    // Get all existing slugs to track new vs updated
    const existingSlugs = new Set(
      (await prisma.jobCategory.findMany({ select: { slug: true } }))
        .map(c => c.slug)
    );

    for (const category of categories) {
      const isNew = !existingSlugs.has(category.slug);

      await prisma.jobCategory.upsert({
        where: { slug: category.slug },
        create: {
          name: category.name,
          slug: category.slug,
          url: category.url,
          rssUrl: category.rssUrl,
          isActive: true,
        },
        update: {
          name: category.name,
          url: category.url,
          rssUrl: category.rssUrl,
        },
      });

      if (isNew) {
        createdCount++;
        logger.info(`Created new category: ${category.name} (${category.slug})`);
      } else {
        updatedCount++;
        logger.debug(`Updated existing category: ${category.name} (${category.slug})`);
      }
    }

    logger.info('Categories saved to database', {
      total: categories.length,
      created: createdCount,
      updated: updatedCount,
    });
  }

  /**
   * Run the complete category scraping process
   */
  async runCategoryScraper(): Promise<void> {
    try {
      const categories = await this.scrapCategories();

      logger.info('Categories scraped: ', { count: categories.length });

      await this.saveCategoriesToDatabase(categories);

    } catch (error) {
      logger.error('Category scraper failed', { error });
      throw error;
    }
  }
}

export const jobCategoriesService = new JobCategoriesService();

