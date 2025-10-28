import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PageScraperService } from '../page-scraper.service';
import * as cheerio from 'cheerio';
import {
  sampleJobPageHtml,
  sampleJobPageWithoutSalary,
} from '../../../__tests__/fixtures/html-samples';
import nock from 'nock';

describe('PageScraperService', () => {
  let pageScraperService: PageScraperService;

  beforeEach(() => {
    pageScraperService = new PageScraperService();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('parseTitle', () => {
    it('should extract job title from HTML', () => {
      const $ = cheerio.load(sampleJobPageHtml);
      const title = pageScraperService.parseTitle($);
      expect(title).toBe('Senior QA Engineer');
    });

    it('should return empty string when title not found', () => {
      const $ = cheerio.load('<html><body></body></html>');
      const title = pageScraperService.parseTitle($);
      expect(title).toBe('');
    });
  });

  describe('parseCompany', () => {
    it('should extract company name, slug and logo URL', () => {
      const $ = cheerio.load(sampleJobPageHtml);
      const company = pageScraperService.parseCompany($);

      expect(company.name).toBe('Tech Company');
      expect(company.slug).toBe('tech-company');
      expect(company.logoUrl).toBe('https://jobs.dou.ua/company-logos/tech-company.png');
    });

    it('should handle missing company information', () => {
      const $ = cheerio.load('<html><body></body></html>');
      const company = pageScraperService.parseCompany($);

      // When company info is missing, the actual implementation returns empty strings
      // but still provides the fallback structure
      expect(company.name).toBeDefined();
      expect(company.slug).toBeDefined();
    });

    it('should convert protocol-relative URLs to https', () => {
      const html = `
        <div class="b-compinfo">
          <div class="logo"><img src="//cdn.example.com/logo.png" /></div>
          <div class="l-n"><a href="/companies/test/">Test</a></div>
        </div>
      `;
      const $ = cheerio.load(html);
      const company = pageScraperService.parseCompany($);

      expect(company.logoUrl).toBe('https://cdn.example.com/logo.png');
    });
  });

  describe('parseSalary', () => {
    it('should extract salary from HTML', () => {
      const $ = cheerio.load(sampleJobPageHtml);
      const salary = pageScraperService.parseSalary($);
      expect(salary).toBe('$2000–3000');
    });

    it('should return undefined when salary not found', () => {
      const $ = cheerio.load(sampleJobPageWithoutSalary);
      const salary = pageScraperService.parseSalary($);
      expect(salary).toBeUndefined();
    });
  });

  describe('parseFullDescription', () => {
    it('should extract full description HTML', () => {
      const $ = cheerio.load(sampleJobPageHtml);
      const description = pageScraperService.parseFullDescription($);

      expect(description).toContain('We are looking for a talented QA Engineer');
      expect(description).toContain('<ul>');
      expect(description).toContain('5+ years of experience');
    });

    it('should return empty string when description not found', () => {
      const $ = cheerio.load('<html><body></body></html>');
      const description = pageScraperService.parseFullDescription($);
      expect(description).toBe('');
    });
  });

  describe('parseLocations', () => {
    it('should extract and parse locations', () => {
      const $ = cheerio.load(sampleJobPageHtml);
      const locations = pageScraperService.parseLocations($);

      expect(locations).toHaveLength(2);
      expect(locations).toContain('Kyiv');
      expect(locations).toContain('remote');
    });

    it('should handle single location', () => {
      const $ = cheerio.load(sampleJobPageWithoutSalary);
      const locations = pageScraperService.parseLocations($);

      expect(locations).toHaveLength(1);
      expect(locations).toContain('Lviv');
    });

    it('should return empty array when no locations found', () => {
      const $ = cheerio.load('<html><body></body></html>');
      const locations = pageScraperService.parseLocations($);
      expect(locations).toHaveLength(0);
    });

    it('should remove duplicate locations', () => {
      const html = '<div class="place-name">Kyiv, Kyiv, remote</div>';
      const $ = cheerio.load(html);
      const locations = pageScraperService.parseLocations($);

      expect(locations).toHaveLength(2);
      expect(locations.filter(loc => loc === 'Kyiv')).toHaveLength(1);
    });
  });

  describe('scrapeJobPage', () => {
    it('should scrape full job page and return parsed data', async () => {
      const url = 'https://jobs.dou.ua/companies/tech-company/vacancies/123456/';

      nock('https://jobs.dou.ua')
        .get('/companies/tech-company/vacancies/123456/')
        .reply(200, sampleJobPageHtml);

      const result = await pageScraperService.scrapeJobPage(url);

      expect(result).toEqual({
        title: 'Senior QA Engineer',
        companyName: 'Tech Company',
        companySlug: 'tech-company',
        companyLogoUrl: 'https://jobs.dou.ua/company-logos/tech-company.png',
        fullDescription: expect.stringContaining('We are looking for a talented QA Engineer'),
        locations: ['Kyiv', 'remote'],
        salary: '$2000–3000',
      });
    });

    it('should handle page without salary', async () => {
      const url = 'https://jobs.dou.ua/companies/startup/vacancies/654321/';

      nock('https://jobs.dou.ua')
        .get('/companies/startup/vacancies/654321/')
        .reply(200, sampleJobPageWithoutSalary);

      const result = await pageScraperService.scrapeJobPage(url);

      expect(result.salary).toBeUndefined();
      expect(result.title).toBe('Junior Developer');
    });

    it('should throw error when page fetch fails', async () => {
      const url = 'https://jobs.dou.ua/companies/test/vacancies/999/';

      nock('https://jobs.dou.ua')
        .get('/companies/test/vacancies/999/')
        .reply(404);

      await expect(pageScraperService.scrapeJobPage(url)).rejects.toThrow();
    });
  });
});

