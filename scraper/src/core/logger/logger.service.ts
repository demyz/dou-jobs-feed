import { type PinoLogger, pinoLogger, createPinoLogger } from './pino-logger';

export class LoggerService {
  private root: PinoLogger;

  constructor({
    logger = pinoLogger,
    context = '',
  }: { logger?: PinoLogger, context?: string } = {}) {
    this.root = context ? createPinoLogger(context) : logger;
  }

  trace(message: string, meta?: object) {
    this.root.trace(meta ?? {}, message);
  }

  debug(message: string, meta?: object) {
    this.root.debug(meta ?? {}, message);
  }

  info(message: string, meta?: object) {
    this.root.info(meta ?? {}, message);
  }

  warn(message: string, meta?: object) {
    this.root.warn(meta ?? {}, message);
  }

  error(message: string, meta?: object | Error) {
    if (meta instanceof Error) {
      this.root.error({ err: meta, msg: message });
    } else {
      this.root.error(meta ?? {}, message);
    }
  }

  fatal(message: string, meta?: object | Error) {
    if (meta instanceof Error) {
      this.root.fatal({ err: meta, msg: message });
    } else {
      this.root.fatal(meta ?? {}, message);
    }
  }

  child(context: string) {
    const logger = this.root.child({ module: context });
    return new LoggerService({ logger });
  }

  flush() {
    this.root.flush?.();
  }
}
