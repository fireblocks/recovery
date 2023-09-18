import { ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import os from 'os';
import archiver from 'archiver';
import stream from 'stream';

const appName = process.env.NODE_ENV === 'development' ? '@fireblocks/recovery-utility' : 'Fireblocks Recovery Utility';

const getLogPath = (processName: 'utility' | 'relay' | 'shared' | 'main' | 'renderer') => {
  switch (os.platform()) {
    case 'darwin':
      // macOS
      return path.join(os.homedir(), 'Library', 'Logs', appName, `${processName}.log`);
    case 'win32':
      // Windows
      return path.join(process.env.USERPROFILE || os.homedir(), 'AppData', 'Roaming', appName, 'logs', `${processName}.log`);
    case 'linux':
      // Linux
      return path.join(os.homedir(), '.config', appName, 'logs', `${processName}.log`);
    default:
      throw new Error('Unsupported platform');
  }
};

const createZipFromFiles = async (...filePaths: string[]) =>
  new Promise<Buffer>((resolve, reject) => {
    // Create an in-memory stream to collect the ZIP archive
    const bufferStream = new stream.PassThrough();
    const zipData: any[] = [];

    bufferStream.on('data', (chunk) => zipData.push(chunk));

    bufferStream.on('end', () => resolve(Buffer.concat(zipData)));

    // Set up Archiver to zip the files
    const archive = archiver('zip');

    // If there's an error, reject the promise
    archive.on('error', (err) => reject(err));

    // Pipe the ZIP archive data to the in-memory stream
    archive.pipe(bufferStream);

    // Append files to the archive
    filePaths.forEach((filePath) => {
      if (fs.existsSync(filePath)) {
        archive.append(fs.createReadStream(filePath), { name: path.basename(filePath) });
      }
    });

    // Finalize the archive (this step is important!)
    archive.finalize();
  });

ipcMain.handle('logs/get', async () =>
  createZipFromFiles(
    getLogPath('utility'),
    getLogPath('relay'),
    getLogPath('shared'),
    getLogPath('main'),
    getLogPath('renderer'),
  ),
);
