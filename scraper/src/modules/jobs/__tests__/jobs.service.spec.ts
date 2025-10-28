import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JobsService } from '../jobs.service';
import { PageScraperService } from '../page-scraper.service';
import { createMockPrismaClient } from '../../../__tests__/mocks/prisma.mock';

describe('JobsService', () => {
  let jobsService: JobsService;
  let mockPageScraper: PageScraperService;
  let mockPrisma: ReturnType<typeof createMockPrismaClient>;

  beforeEach(() => {
    mockPageScraper = {
      scrapeJobPage: vi.fn(),
    } as any;

    mockPrisma = createMockPrismaClient();
    jobsService = new JobsService(mockPageScraper, mockPrisma);
  });

  describe('extractDouIdFromUrl', () => {
    it('should extract DOU ID from URL', () => {
      const url = 'https://jobs.dou.ua/companies/eleks/vacancies/328133/';
      const douId = jobsService.extractDouIdFromUrl(url);
      expect(douId).toBe(328133);
    });

    it('should return null for invalid URL', () => {
      const url = 'https://jobs.dou.ua/companies/eleks/';
      const douId = jobsService.extractDouIdFromUrl(url);
      expect(douId).toBeNull();
    });

    it('should handle URLs with query parameters', () => {
      const url = 'https://jobs.dou.ua/companies/eleks/vacancies/328133/?from=feed';
      const douId = jobsService.extractDouIdFromUrl(url);
      expect(douId).toBe(328133);
    });
  });

  describe('cleanUrl', () => {
    it('should remove query parameters from URL', () => {
      const url = 'https://jobs.dou.ua/vacancies/123/?utm_source=feed&utm_medium=rss';
      const cleanedUrl = jobsService.cleanUrl(url);
      expect(cleanedUrl).toBe('https://jobs.dou.ua/vacancies/123/');
    });

    it('should return URL unchanged if no query parameters', () => {
      const url = 'https://jobs.dou.ua/vacancies/123/';
      const cleanedUrl = jobsService.cleanUrl(url);
      expect(cleanedUrl).toBe(url);
    });

    it('should handle invalid URLs gracefully', () => {
      const url = 'not-a-url';
      const cleanedUrl = jobsService.cleanUrl(url);
      expect(cleanedUrl).toBe(url);
    });
  });

  describe('findOrCreateCompany', () => {
    it('should create new company if not exists', async () => {
      const mockCompany = { id: 'company1', slug: 'test-co', name: 'Test Co' };

      mockPrisma.company.upsert.mockResolvedValue(mockCompany);

      const companyId = await jobsService.findOrCreateCompany(
        'test-co',
        'Test Co',
        'https://example.com/logo.png'
      );

      expect(companyId).toBe('company1');
      expect(mockPrisma.company.upsert).toHaveBeenCalledWith({
        where: { slug: 'test-co' },
        create: {
          slug: 'test-co',
          name: 'Test Co',
          logoUrl: 'https://example.com/logo.png',
        },
        update: {
          name: 'Test Co',
          logoUrl: 'https://example.com/logo.png',
        },
        select: { id: true },
      });
    });

    it('should update existing company', async () => {
      const mockCompany = { id: 'company1', slug: 'test-co', name: 'Test Co Updated' };

      mockPrisma.company.upsert.mockResolvedValue(mockCompany);

      const companyId = await jobsService.findOrCreateCompany(
        'test-co',
        'Test Co Updated'
      );

      expect(companyId).toBe('company1');
    });
  });

  describe('findOrCreateLocation', () => {
    it('should create location with generated slug', async () => {
      const mockLocation = { id: 'loc1', slug: 'kyiv', name: 'Kyiv' };

      mockPrisma.location.upsert.mockResolvedValue(mockLocation);

      const locationId = await jobsService.findOrCreateLocation('Kyiv');

      expect(locationId).toBe('loc1');
      expect(mockPrisma.location.upsert).toHaveBeenCalledWith({
        where: { slug: 'kyiv' },
        create: {
          name: 'Kyiv',
          slug: 'kyiv',
          source: 'job_parser',
          isActive: true,
        },
        update: {
          name: 'Kyiv',
        },
        select: { id: true },
      });
    });

    it('should generate slug from complex location name', async () => {
      const mockLocation = { id: 'loc1', slug: 'new-york-usa', name: 'New York, USA' };

      mockPrisma.location.upsert.mockResolvedValue(mockLocation);

      await jobsService.findOrCreateLocation('New York, USA');

      expect(mockPrisma.location.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slug: 'new-york-usa' },
        })
      );
    });
  });

  describe('getActiveCategories', () => {
    it('should return active categories', async () => {
      const mockCategories = [
        { id: 'cat1', name: 'QA', slug: 'qa', isActive: true },
        { id: 'cat2', name: 'DevOps', slug: 'devops', isActive: true },
      ];

      mockPrisma.jobCategory.findMany.mockResolvedValue(mockCategories);

      const categories = await jobsService.getActiveCategories();

      expect(categories).toHaveLength(2);
      expect(mockPrisma.jobCategory.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });
    });

    it('should return empty array when no active categories', async () => {
      mockPrisma.jobCategory.findMany.mockResolvedValue([]);

      const categories = await jobsService.getActiveCategories();

      expect(categories).toHaveLength(0);
    });
  });

  describe('scrapeJobDetails', () => {
    it('should scrape and parse job details', async () => {
      const rssItem = {
        title: 'Test Job',
        link: 'https://jobs.dou.ua/companies/test/vacancies/12345/?from=rss',
        isoDate: '2024-01-15T10:00:00.000Z',
        content: 'Short description',
      };

      const mockPageData = {
        title: 'Test Job',
        companyName: 'Test Company',
        companySlug: 'test',
        fullDescription: '<p>Full description</p>',
        locations: ['Kyiv', 'remote'],
        salary: '$2000-3000',
      };

      (mockPageScraper.scrapeJobPage as any).mockResolvedValue(mockPageData);

      const result = await jobsService.scrapeJobDetails(rssItem as any);

      expect(result).toEqual({
        douId: 12345,
        title: 'Test Job',
        url: 'https://jobs.dou.ua/companies/test/vacancies/12345/',
        companyName: 'Test Company',
        companySlug: 'test',
        description: 'Short description',
        fullDescription: '<p>Full description</p>',
        locations: ['Kyiv', 'remote'],
        salary: '$2000-3000',
        publishedAt: expect.any(Date),
      });

      expect(mockPageScraper.scrapeJobPage).toHaveBeenCalledWith(
        'https://jobs.dou.ua/companies/test/vacancies/12345/'
      );
    });

    it('should return null if DOU ID cannot be extracted', async () => {
      const rssItem = {
        title: 'Test Job',
        link: 'https://jobs.dou.ua/invalid/',
        isoDate: '2024-01-15T10:00:00.000Z',
      };

      const result = await jobsService.scrapeJobDetails(rssItem as any);

      expect(result).toBeNull();
      expect(mockPageScraper.scrapeJobPage).not.toHaveBeenCalled();
    });

    it('should handle scraping errors gracefully', async () => {
      const rssItem = {
        title: 'Test Job',
        link: 'https://jobs.dou.ua/companies/test/vacancies/12345/',
        isoDate: '2024-01-15T10:00:00.000Z',
      };

      (mockPageScraper.scrapeJobPage as any).mockRejectedValue(
        new Error('Page not found')
      );

      const result = await jobsService.scrapeJobDetails(rssItem as any);

      expect(result).toBeNull();
    });
  });

  describe('saveJobWithDetails', () => {
    it('should save new job with all details', async () => {
      const jobData = {
        douId: 12345,
        title: 'Test Job',
        url: 'https://jobs.dou.ua/vacancies/12345/',
        companyName: 'Test Company',
        companySlug: 'test-co',
        description: 'Short desc',
        fullDescription: '<p>Full desc</p>',
        locations: ['Kyiv', 'remote'],
        salary: '$2000',
        publishedAt: new Date('2024-01-15'),
      };

      mockPrisma.company.upsert.mockResolvedValue({ id: 'company1' });
      mockPrisma.job.findUnique.mockResolvedValue(null); // Job doesn't exist
      mockPrisma.job.upsert.mockResolvedValue({ id: 'job1' });
      mockPrisma.location.upsert
        .mockResolvedValueOnce({ id: 'loc1' })
        .mockResolvedValueOnce({ id: 'loc2' });
      mockPrisma.jobLocation.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.jobLocation.create.mockResolvedValue({} as any);

      const isNewJob = await jobsService.saveJobWithDetails(jobData, 'cat1');

      expect(isNewJob).toBe(true);
      expect(mockPrisma.job.upsert).toHaveBeenCalled();
      expect(mockPrisma.jobLocation.create).toHaveBeenCalledTimes(2);
    });

    it('should update existing job', async () => {
      const jobData = {
        douId: 12345,
        title: 'Updated Job',
        url: 'https://jobs.dou.ua/vacancies/12345/',
        companyName: 'Test Company',
        companySlug: 'test-co',
        description: 'Updated desc',
        fullDescription: '<p>Updated</p>',
        locations: [],
        publishedAt: new Date('2024-01-15'),
      };

      mockPrisma.company.upsert.mockResolvedValue({ id: 'company1' });
      mockPrisma.job.findUnique.mockResolvedValue({ id: 'job1' } as any); // Job exists
      mockPrisma.job.upsert.mockResolvedValue({ id: 'job1' });

      const isNewJob = await jobsService.saveJobWithDetails(jobData, 'cat1');

      expect(isNewJob).toBe(false);
    });
  });
});

