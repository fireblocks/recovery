import { ipcMain } from 'electron';
import { SettingsStore } from '../store/settings';

ipcMain.handle('settings/restore', () => SettingsStore.get());
