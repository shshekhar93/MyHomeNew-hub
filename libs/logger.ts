import { createLogger, format, transports } from 'winston';
import expressWinston from 'express-winston';
import type { Request } from 'express';

const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json(),
  ),
  transports: [new transports.Console()],
});

const logInfo = logger.log.bind(logger, 'info');
const logError = logger.log.bind(logger, 'error');

expressWinston.requestWhitelist = ['method', 'originalUrl', 'headers'];
const headersToPick = ['host', 'user-agent', 'referer'];

const requestFilter = (req: Request, prop: string) => {
  if (prop !== 'headers') {
    return req[prop as keyof typeof req];
  }

  return Object.fromEntries(
    Object.entries(req.headers).filter(([key]) => headersToPick.includes(key)),
  );
};

const logMiddleware = expressWinston.logger({
  transports: [new transports.Console()],
  format: format.json(),
  expressFormat: true,
  colorize: false,
  requestFilter,
});

export { logger, logInfo, logError, logMiddleware };
