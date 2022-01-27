const { createLogger, format, transports } = require('winston');
const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json(),
  ),
  transports: [new transports.Console()]
});

const logInfo = logger.log.bind(logger, 'info');
const logError = logger.log.bind(logger, 'error');

module.exports = {
  logger,
  logInfo,
  logError,
};
