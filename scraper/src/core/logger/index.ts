import { LoggerService, createPinoLogger } from '@repo/logger';
import { config, isProd } from '@/config/index';

const root = createPinoLogger({
  serviceName: config.serviceName,
  level: config.logLevel,
  isProd,
});

export const logger = new LoggerService({ logger: root });
