import { ipcMain } from 'electron';
import { DeploymentStore } from '../store/deployment';

ipcMain.handle('deployment/get', (event) => DeploymentStore.get().protocol);
