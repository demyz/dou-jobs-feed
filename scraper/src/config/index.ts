import dotenv from 'dotenv';

dotenv.config();

export const isProd = process.env.NODE_ENV === 'production';

export const config = {
  database: {
    url: process.env.DATABASE_URL || '',
  },

  serviceName: process.env.SERVICE_NAME || 'scraper',

  logLevel: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
};
