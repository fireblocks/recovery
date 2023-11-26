import log from 'electron-log';

export type LoggerName = 'utility' | 'relay' | 'shared';

export interface CustomElectronLogger extends log.ElectronLog {
  logSigningTx: (chain: string, value: unknown) => void;
  logPreparedData: (chain: string, value: unknown) => void;
  logStateChange: (variableName: string, newValue: unknown) => void;
}

const loggers: { [key in LoggerName]?: log.ElectronLog } = {};

export const getLogger: (name: LoggerName) => CustomElectronLogger = (name: LoggerName) => {
  if (loggers[name]) {
    return loggers[name]! as CustomElectronLogger;
  }

  const logger = log.create(name) as CustomElectronLogger;
  logger.transports.file.fileName = `${name}.log`;
  logger.transports.file.maxSize = 1024 * 1024 * 10; // 10MB
  logger.transports.file.level = 'debug';
  logger.catchErrors({
    showDialog: false,
    onError: (error, versions, submitIssue) => {
      logger.error(`${name}: Unhandled error: ${error.message}`, error.stack);
    },
  });

  logger.logSigningTx = (chain: string, value: unknown): void => {
    logger.debug(`${chain}: Signing Tx: ${JSON.stringify(value, (_, v) => (typeof v === 'bigint' ? v.toString() : v), 2)}`);
  };

  logger.logPreparedData = (chain: string, value: unknown): void => {
    logger.debug(`${chain}: Prepared data: ${JSON.stringify(value, (_, v) => (typeof v === 'bigint' ? v.toString() : v), 2)}`);
  };

  logger.logStateChange = (variableName: string, newValue: unknown): void => {
    try {
      let cache: any[] = [];
      logger.debug(
        `${variableName} changed to: ${JSON.stringify(
          newValue,
          (_, v) => {
            if (typeof v === 'object' && v !== null) {
              if (cache.includes(v)) return '[Circular]';
              cache.push(v);
            }
            return typeof v === 'bigint' ? v.toString() : typeof v === 'function' ? 'function' : v;
          },
          2,
        )}`,
      );
    } catch (e) {
      logger.warn('Unable to print state change', e);
    }
  };

  loggers[name] = logger;

  return logger as CustomElectronLogger;
};
