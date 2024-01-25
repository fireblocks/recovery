import { RelaunchOptions, ipcMain } from 'electron';
import { app } from 'electron';
import os from 'os';

import { DeploymentStore } from '../store/deployment';
import { createWindow } from '../background';

ipcMain.handle('deployment/use', async (event, protocol: 'UTILITY' | 'RELAY') => {
  DeploymentStore.set(protocol);
  let opts: RelaunchOptions | undefined;
  if (os.platform() === 'linux') {
    /**
     * On linux we use AppImage, which upon execution mounts the AppImage file onto a directory under /tmp/.mount_xxxxx
     * When we run the relaunch and exit command it is unmounted.
     * Subsequent attempts to access anything under the original mount point results in an error.
     * As such we can't simply use relaunch and exit, we need to extract the AppImage and run it.
     *
     * This does not consume additional disk space as as soon as the execution ends, the disk space is freed.
     */
    const args = process.argv.slice(1).concat(['--relaunch']);
    args.unshift('--appimage-extract-and-run');
    opts = {
      execPath: process.env.APPIMAGE,
      args,
    };
  }
  app.relaunch(opts);
  app.exit();
  await createWindow();
});

ipcMain.handle('deployment/reset', async () => {
  DeploymentStore.reset();
});
