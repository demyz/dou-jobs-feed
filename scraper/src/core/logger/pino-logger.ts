import pino from "pino";
import { isProd, config } from "@/config";

export const pinoLogger = pino({
  level: config.logLevel,
  base: { service: config.serviceName },
  transport: isProd
    ? undefined
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss.l",
          ignore: "pid,hostname",
        },
      },
});

export const createPinoLogger = (moduleName: string) =>
  pinoLogger.child({ module: moduleName });
