import axios from 'axios';
import * as cheerio from 'cheerio';
import { logger } from '@/core/logger/index';

export interface JobPageData {
  fullDescription: string;
  locations: string[];
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
   * Locations are typically in the job title format: "Job Title at Company, Location1, Location2"
   * Or in a specific location section
   */
  parseLocations($: cheerio.CheerioAPI): string[] {
    try {
      const locations: string[] = [];

      // Try to find locations in the page header
      // Usually in format: "Moldova, Poland, Limassol (Cyprus), remote"
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

      const fullDescription = this.parseFullDescription($);
      const locations = this.parseLocations($);

      logger.debug('Job page scraped successfully', {
        url,
        hasDescription: fullDescription.length > 0,
        locationsCount: locations.length,
      });

      return {
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

