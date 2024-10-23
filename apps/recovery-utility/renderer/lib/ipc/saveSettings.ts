import { ipcRenderer } from 'electron';
import { z } from 'zod';
import { settingsInput } from '@fireblocks/recovery-shared';

type Settings = z.infer<(typeof settingsInput)['UTILITY']>;

export const saveSettings = (settings: Settings) => ipcRenderer.invoke('settings/save', settings) as Promise<void>;
