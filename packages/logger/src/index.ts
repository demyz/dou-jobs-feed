import pino, { type Logger } from 'pino';

export type { Logger as PinoLogger };

export type PrettyOptions = {
  colorize?: boolean;
  translateTime?: string;
  ignore?: string;
};

export type CreateLoggerOptions = {
  serviceName: string;
  level?: string;
  isProd?: boolean;
  prettyOptions?: PrettyOptions;
  baseBindings?: Record<string, unknown>;
};

const defaultPretty: PrettyOptions = {
  colorize: true,
  translateTime: 'HH:MM:ss.l',
  ignore: 'pid,hostname',
};

export const createPinoLogger = ({
  serviceName,
  level = 'info',
  isProd = false,
  prettyOptions,
  baseBindings,
}: CreateLoggerOptions): Logger => {
  return pino({
    level,
    base: { service: serviceName, ...(baseBindings ?? {}) },
    transport: isProd
      ? undefined
      : {
          target: 'pino-pretty',
          options: { ...(defaultPretty as object), ...(prettyOptions ?? {}) },
        },
  });
};

export class LoggerService {
  private root: Logger;

  constructor({ logger, context }: { logger: Logger; context?: string }) {
    this.root = context ? logger.child({ module: context }) : logger;
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
    (this.root as any).flush?.();
  }
}


