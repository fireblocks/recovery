import log from 'electron-log';
import path from 'path';
import fs from 'fs';
import os from 'os';

export type LoggerName = 'utility' | 'relay' | 'shared';

const formatDate = (): string => {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return [now.getFullYear(), pad(now.getMonth() + 1), pad(now.getDate())].join('_');
};

const getLogBaseDir = (): string => {
  const appName = process.env.NODE_ENV === 'development' ? '@fireblocks/recovery-utility' : 'Fireblocks Recovery Utility';
  switch (os.platform()) {
    case 'darwin':
      return path.join(os.homedir(), 'Library', 'Logs', appName);
    case 'linux':
      return path.join(os.homedir(), '.config', appName, 'logs');
    case 'win32':
      return path.join(process.env.USERPROFILE || os.homedir(), 'AppData', 'Roaming', appName, 'logs');
    default:
      throw new Error('Unsupported platform');
  }
};

const sessionFolder = path.join(getLogBaseDir(), formatDate());
const baseLogDir = getLogBaseDir();
if (!fs.existsSync(sessionFolder)) {
  fs.mkdirSync(sessionFolder, { recursive: true });

  // Limit to 7 daily folders, delete oldest if needed
  const folders = fs
    .readdirSync(baseLogDir)
    .filter((f) => /^\d{4}_\d{2}_\d{2}$/.test(f))
    .map((f) => ({ name: f }))
    .sort((a, b) => a.name.localeCompare(b.name));
  if (folders.length > 7) {
    const toDelete = folders.slice(0, folders.length - 7);
    toDelete.forEach(({ name }) => {
      try {
        fs.rmSync(path.join(baseLogDir, name), { recursive: true, force: true });
      } catch (e) {
        console.error(e);
      }
    });
  }
}

log.transports.file.resolvePath = (variables) => path.join(sessionFolder, variables.fileName ?? 'default.log');

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
  logger.transports.file.resolvePath = log.transports.file.resolvePath; // today's folder
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
