import { PrismaClient } from '@prisma/client';

// Create singleton instance
export const prisma = new PrismaClient();

// Re-export everything from Prisma Client for convenience
export * from '@prisma/client';


