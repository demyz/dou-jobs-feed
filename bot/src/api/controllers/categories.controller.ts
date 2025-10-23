import type { Request, Response } from 'express';
import { prisma } from '@repo/database';
import { logger } from '../../shared/logger.js';

/**
 * Get all active categories
 */
export async function getCategories(req: Request, res: Response) {
  try {
    const categories = await prisma.jobCategory.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: categories });
  } catch (error) {
    logger.error('Error fetching categories', { error });
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
}


