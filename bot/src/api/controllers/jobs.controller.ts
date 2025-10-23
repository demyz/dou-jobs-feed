import type { Request, Response } from 'express';
import { prisma } from '@repo/database';
import { logger } from '../../shared/logger.js';

/**
 * Get job details by ID
 */
export async function getJobById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        locations: {
          include: {
            location: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!job) {
      res.status(404).json({ success: false, error: 'Job not found' });
      return;
    }

    // Transform locations for easier access
    const transformedJob = {
      ...job,
      locations: job.locations.map((jl) => jl.location),
    };

    res.json({ success: true, data: transformedJob });
  } catch (error) {
    logger.error('Error fetching job', { error, jobId: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to fetch job' });
  }
}


