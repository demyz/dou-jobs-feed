import type { Request, Response } from 'express';
import { prisma } from '@repo/database';
import { logger } from '../../shared/logger.js';

/**
 * Get all active locations
 */
export async function getLocations(req: Request, res: Response) {
  try {
    const locations = await prisma.location.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: locations });
  } catch (error) {
    logger.error('Error fetching locations', { error });
    res.status(500).json({ success: false, error: 'Failed to fetch locations' });
  }
}


