import axios from 'axios';
import * as cheerio from 'cheerio';
import { logger } from '@/core/logger/index';
import { config } from '@/config/index';
import { prisma } from '@/core/database/index';

interface Location {
  name: string;
  slug: string;
}

export class JobLocationsService {
  private readonly baseUrl: string;
  private readonly userAgent: string;
  private readonly selector: string;
  private readonly locationsUrl: string;

  constructor() {
    this.baseUrl = config.baseUrl;
    this.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    this.selector = '.b-region-filter ul:nth-of-type(2) a';
    this.locationsUrl = `${this.baseUrl}/vacancies`;
  }

  async scrapeLocations(): Promise<Location[]> {
    try {
      logger.info('Fetching locations from DOU.ua', { locationsUrl: this.locationsUrl });

      // Use jobs page to get all locations
      const response = await axios.get(this.locationsUrl, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
          'Cookie': 'lang=en',
        }
      });

      const $ = cheerio.load(response.data);

      const locations: Location[] = [
        {
          name: 'remote',
          slug: 'remote',
        },
        {
          name: 'abroad',
          slug: 'relocation',
        },
      ];

      $(this.selector).each((_index, element) => {
        const $link = $(element);
        const name = $link.text().trim();
        const href = $link.attr('href');

        if (name && href) {
          // Extract location parameter from URL
          // Example: /vacancies/?city=Kyiv
          const urlParams = new URLSearchParams(href.split('?')[1] || '');
          const slug = urlParams.get('city');

          if (slug) {
            locations.push({
              name,
              slug,
            });
          }
        }
      });

      logger.info('Successfully scraped locations', { count: locations.length });

      return locations;
    } catch (error) {
      logger.error('Failed to scrape locations', { error, baseUrl: this.baseUrl });
      throw error;
    }
  }

  async saveLocationsToDatabase(locations: Location[]): Promise<void> {
    let createdCount = 0;
    let updatedCount = 0;

    // Get all existing slugs to track new vs updated
    const existingSlugs = new Set(
      (await prisma.location.findMany({ select: { slug: true } }))
        .map(l => l.slug)
    );

    for (const location of locations) {
      const isNew = !existingSlugs.has(location.slug);

      await prisma.location.upsert({
        where: { slug: location.slug },
        create: {
          name: location.name,
          slug: location.slug,
          source: 'scraper',
          isActive: true,
        },
        update: {
          name: location.name,
        },
      });

      if (isNew) {
        createdCount++;
        logger.info(`Created new location: ${location.name} (${location.slug})`);
      } else {
        updatedCount++;
        logger.debug(`Updated existing location: ${location.name} (${location.slug})`);
      }
    }

    logger.info('Locations saved to database', {
      total: locations.length,
      created: createdCount,
      updated: updatedCount,
    });
  }

  /**
   * Run the complete location scraping process
   */
  async runLocationScraper(): Promise<void> {
    try {
      const locations = await this.scrapeLocations();

      logger.info('Locations scraped: ', { count: locations.length });

      await this.saveLocationsToDatabase(locations);

    } catch (error) {
      logger.error('Location scraper failed', { error });
      throw error;
    }
  }
}

export const jobLocationsService = new JobLocationsService();

