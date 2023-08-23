import log from 'electron-log';

export type LoggerName = 'utility' | 'relay' | 'shared';

const loggers: { [key in LoggerName]?: log.ElectronLog } = {};

export const getLogger: (name: LoggerName) => log.ElectronLog = (name: LoggerName) => {
  if (loggers[name]) {
    return loggers[name]!;
  }

  const logger = log.create(name);
  logger.transports.file.fileName = `${name}.log`;
  logger.transports.file.maxSize = 1024 * 1024 * 10; // 10MB
  logger.transports.file.level = 'info';
  logger.catchErrors({
    showDialog: false,
    onError: (error, versions, submitIssue) => {
      console.error(`${name}: Unhandled error: ${error.message}`, error.stack);
    },
  });
  loggers[name] = logger;

  return logger;
};
