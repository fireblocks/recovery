import { ipcMain } from 'electron';
import { app } from 'electron';

import { DeploymentStore } from '../store/deployment';
import { createWindow } from '../background';

ipcMain.handle('deployment/save', async (event, protocol: 'UTILITY' | 'RELAY') => {
  DeploymentStore.set(protocol);
  app.relaunch();
  app.exit();
  await createWindow();
});
