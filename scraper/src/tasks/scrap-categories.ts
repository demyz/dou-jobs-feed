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

/**
 * Scrapes job categories from DOU.ua jobs page
 * @returns Array of category objects with name, slug, and url
 */
export async function scrapCategories(): Promise<Category[]> {
  const baseUrl = config.baseUrl;
  const url = `${baseUrl}/`;
  const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

  try {
    logger.info('Fetching categories from DOU.ua', { url });

    // Fetch the page HTML
    const response = await axios.get(url, {
      headers: {
        'User-Agent': userAgent
      }
    });

    // Load HTML into cheerio
    const $ = cheerio.load(response.data);

    // Find all category options
    const categories: Category[] = [];
    const selector = '.b-jobs-search select[name=category] option';

    $(selector).each((_index, element) => {
      const $option = $(element);
      const value = $option.attr('value');
      const name = $option.text().trim();

      // Skip empty options (like "Всі категорії" or empty values)
      if (value && value !== '' && name && name !== '') {
        // Extract slug from value (it usually contains the category slug)
        const slug = value;

        // Construct full URL
        const categoryUrl = `${baseUrl}/vacancies/?category=${encodeURIComponent(slug)}`;

        const rssUrl = `${baseUrl}/vacancies/feeds/?category=${encodeURIComponent(slug)}`;

        categories.push({
          name,
          slug,
          url: categoryUrl,
          rssUrl,
        });
      }
    });

    logger.info('Successfully scraped categories', { count: categories.length });

    return categories;
  } catch (error) {
    logger.error('Failed to scrape categories', { error, url });
    throw error;
  }
}

/**
 * Saves categories to the database
 * Creates new categories if they don't exist (based on slug)
 * Updates existing categories with new data
 */
async function saveCategoriesToDatabase(categories: Category[]): Promise<void> {
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
 * Main function to run the category scraper
 */
export async function runCategoryScraper(): Promise<void> {
  try {
    const categories = await scrapCategories();

    logger.info('Categories scraped: ', { count: categories.length });

    await saveCategoriesToDatabase(categories);

  } catch (error) {
    logger.error('Category scraper failed', { error });
    throw error;
  }
}

