import { Page } from 'playwright-core';
import os from 'os';
import fs from 'fs';
import path from 'path';
import stream from 'stream';
import archiver from 'archiver';

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const sleep = async (ms: number) => await new Promise((r) => setTimeout(r, ms));

const waitForLoadingToEnd = async (page: Page) => {
  for (;;) {
    const visible = await page.locator('.MuiCircularProgress-indeterminate').first().isVisible();
    if (visible) {
      sleep(100);
      continue;
    }
    return;
  }
};

const testFailed = async (onApp: 'utility' | 'relay', assetId: string) => {
  const appName = process.env.NODE_ENV === 'development' ? '@fireblocks/recovery-utility' : 'Fireblocks Recovery Utility';

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
  ) => {
    const fileName = processName === '' ? '' : `${processName}.log`;
    switch (os.platform()) {
      case 'darwin':
        // macOS
        return path.join(os.homedir(), 'Library', 'Logs', appName, fileName);
      case 'win32':
        // Windows
        return path.join(process.env.USERPROFILE || os.homedir(), 'AppData', 'Roaming', appName, 'logs', fileName);
      case 'linux':
        // Linux
        return path.join(os.homedir(), '.config', appName, 'logs', fileName);
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

  const logFiles = [
    getLogPath('utility'),
    getLogPath('relay'),
    getLogPath('shared'),
    getLogPath('main'),
    getLogPath('renderer'),
    getLogPath('utility.old'),
    getLogPath('relay.old'),
    getLogPath('shared.old'),
    getLogPath('main.old'),
    getLogPath('renderer.old'),
  ];

  const zipBuffer = await createZipFromFiles(...logFiles);
  try {
    fs.mkdirSync('./tests/failed-tests/', { recursive: true });
  } catch {}
  fs.writeFileSync(`./tests/failed-tests/${assetId}-${Date.now()}.zip`, zipBuffer);

  throw new Error(`Failed to transfer ${assetId} due to console error`);
};

// const wrapFunc = <T extends AsyncFn>(call: T): ((...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>>) => {
//   return async (...args: Parameters<T>) => {
//     try {
//       const res = await call(...args);
//       await sleep(500);
//       return res;
//     } catch (e) {
//       if (e instanceof SoftError) {
//         test.fail(true, e.message);
//         return;
//       }
//       await (args[0] as Page).pause();
//       throw e;
//     }
//   };
// };

export { assert, testFailed, sleep, waitForLoadingToEnd };
