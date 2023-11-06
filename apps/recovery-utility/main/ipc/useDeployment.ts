import { ipcMain } from 'electron';
import { app } from 'electron';

import { DeploymentStore } from '../store/deployment';
import { createWindow } from '../background';

ipcMain.handle('deployment/use', async (event, protocol: 'UTILITY' | 'RELAY') => {
  DeploymentStore.set(protocol);
  app.relaunch();
  app.exit();
  await createWindow();
});

ipcMain.handle('deployment/reset', async () => {
  DeploymentStore.reset();
});
