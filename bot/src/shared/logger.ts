import { LoggerService, createPinoLogger } from '@repo/logger';
import { config } from './config.js';

const root = createPinoLogger({
  serviceName: 'bot',
  level: config.isProduction ? 'info' : 'debug',
  isProd: config.isProduction,
  prettyOptions: { translateTime: 'HH:MM:ss' },
});

export const logger = new LoggerService({ logger: root });


