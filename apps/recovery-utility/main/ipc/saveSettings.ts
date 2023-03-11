import { ipcMain } from 'electron';
import { SettingsStore, Settings } from '../store/settings';

ipcMain.handle('settings/save', (event, args: Settings) => SettingsStore.set(args));
