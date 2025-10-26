import axios from 'axios';
import * as cheerio from 'cheerio';
import { logger } from '@/core/logger/index';

export interface JobPageData {
  title: string;
  companyName: string;
  companySlug: string;
  fullDescription: string;
  locations: string[];
  salary?: string;
}

export class PageScraperService {
  private readonly userAgent: string;

  constructor() {
    this.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }

  /**
   * Fetch job page HTML with English language setting
   */
  async fetchJobPage(url: string): Promise<string> {
    try {
      logger.debug('Fetching job page', { url });

      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
          'Cookie': 'lang=en',
        },
      });

      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to fetch job page', {
        error: errorMessage,
        url,
      });
      throw error;
    }
  }

  /**
   * Parse job title from page
   * Selector: .l-vacancy h1.g-h2
   */
  parseTitle($: cheerio.CheerioAPI): string {
    try {
      const title = $('.l-vacancy h1.g-h2').text().trim();

      if (!title) {
        logger.warn('Could not find title element on page');
        return '';
      }

      return title;
    } catch (error) {
      logger.error('Failed to parse title', { error });
      return '';
    }
  }

  /**
   * Parse company name and slug from page
   * Selector: .b-compinfo .l-n a:first-child
   * Returns company name and slug extracted from href
   */
  parseCompany($: cheerio.CheerioAPI): { name: string; slug: string } {
    try {
      const companyLink = $('.b-compinfo .l-n a:first-child');
      const name = companyLink.text().trim();
      const href = companyLink.attr('href') || '';

      // Extract slug from href like "/companies/devit/"
      const slugMatch = href.match(/\/companies\/([^/]+)\//);
      const slug = slugMatch ? slugMatch[1] : '';

      if (!name || !slug) {
        logger.warn('Could not find company name or slug on page', { name, slug, href });
      }

      return { name, slug };
    } catch (error) {
      logger.error('Failed to parse company', { error });
      return { name: 'Unknown Company', slug: 'unknown' };
    }
  }

  /**
   * Parse salary from page
   * Selector: .l-vacancy .sh-info .salary
   * Returns salary string like "$1100–1500" or null if not found
   */
  parseSalary($: cheerio.CheerioAPI): string | undefined {
    try {
      const salary = $('.l-vacancy .sh-info .salary').text().trim();

      if (!salary || salary.length === 0) {
        return undefined;
      }

      return salary;
    } catch (error) {
      logger.error('Failed to parse salary', { error });
      return undefined;
    }
  }

  /**
   * Parse full description from job page
   * The description is usually in a div with class "b-typo vacancy-section"
   */
  parseFullDescription($: cheerio.CheerioAPI): string {
    try {
      // Try to find the vacancy description section
      const descriptionElement = $('.b-typo.vacancy-section');

      if (descriptionElement.length > 0) {
        // Get HTML content
        return descriptionElement.html()?.trim() || '';
      }

      // Fallback: try other possible selectors
      const fallbackElement = $('.vacancy-section');
      if (fallbackElement.length > 0) {
        return fallbackElement.html()?.trim() || '';
      }

      logger.warn('Could not find description element on page');
      return '';
    } catch (error) {
      logger.error('Failed to parse full description', { error });
      return '';
    }
  }

  /**
   * Parse locations from job page
   * Locations are typically in the page header
   * Usually in format: "Moldova, Poland, Limassol (Cyprus), remote"
   */
  parseLocations($: cheerio.CheerioAPI): string[] {
    try {
      const locations: string[] = [];

      // Try to find locations in the page header
      const locationText = $('.place-name').text().trim();

      if (locationText) {
        // Split by comma and clean up each location
        const locationParts = locationText
          .split(',')
          .map(loc => loc.trim())
          .filter(loc => loc.length > 0);

        locations.push(...locationParts);
      }

      // Remove duplicates
      return [...new Set(locations)];
    } catch (error) {
      logger.error('Failed to parse locations', { error });
      return [];
    }
  }

  /**
   * Scrape job page and extract all data
   */
  async scrapeJobPage(url: string): Promise<JobPageData> {
    try {
      const html = await this.fetchJobPage(url);
      const $ = cheerio.load(html);

      const title = this.parseTitle($);
      const company = this.parseCompany($);
      const salary = this.parseSalary($);
      const fullDescription = this.parseFullDescription($);
      const locations = this.parseLocations($);

      logger.debug('Job page scraped successfully', {
        url,
        title,
        companyName: company.name,
        hasSalary: !!salary,
        hasDescription: fullDescription.length > 0,
        locationsCount: locations.length,
      });

      return {
        title,
        companyName: company.name,
        companySlug: company.slug,
        salary,
        fullDescription,
        locations,
      };
    } catch (error) {
      logger.error('Failed to scrape job page', { error, url });
      throw error;
    }
  }
}

export const pageScraperService = new PageScraperService();

