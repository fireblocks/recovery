import { ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import os from 'os';

const appName = process.env.NODE_ENV === 'development' ? '@fireblocks/recovery-utility' : 'Fireblocks Recovery Utility';

const getTodayLogFolder = () => {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return [now.getFullYear(), pad(now.getMonth() + 1), pad(now.getDate())].join('_');
};

const getLogBaseDir = (): string => {
  const dailyFolder = getTodayLogFolder();
  switch (os.platform()) {
    case 'darwin':
      // macOS
      return path.join(os.homedir(), 'Library', 'Logs', appName, dailyFolder);
    case 'win32':
      // Windows
      return path.join(process.env.USERPROFILE || os.homedir(), 'AppData', 'Roaming', appName, 'logs', dailyFolder);
    case 'linux':
      // Linux
      return path.join(os.homedir(), '.config', appName, 'logs', dailyFolder);
    default:
      throw new Error('Unsupported platform');
  }
};

// Get a log path for a given process name inside the daily folder
const getLogPath = (
  processName:
    | 'utility'
    | 'relay'
    | 'shared'
    | 'main'
    | 'renderer'
    | 'utility.old'
    | 'relay.old'
    | 'shared.old'
    | 'main.old'
    | 'renderer.old'
    | '',
): string => {
  const fileName = processName === '' ? '' : `${processName}.log`;
  return path.join(getLogBaseDir(), fileName);
};

ipcMain.handle('logs/get_path', async () => getLogPath(''));

ipcMain.handle('logs/get', async () => {
  return;
});

ipcMain.handle('logs/reset', async () => resetLogs());

export const resetLogs = () => {
  const processNames = [
    'utility',
    'relay',
    'shared',
    'main',
    'renderer',
    'utility.old',
    'relay.old',
    'shared.old',
    'main.old',
    'renderer.old',
  ];
  processNames.forEach((name: any) => {
    const file = getLogPath(name);
    if (file && fs.existsSync(file)) {
      fs.truncateSync(file, 0);
    }
  });
};
