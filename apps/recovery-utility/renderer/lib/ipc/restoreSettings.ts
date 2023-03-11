import { ipcRenderer } from 'electron';
import { z } from 'zod';
import { settingsInput } from '@fireblocks/recovery-shared';

type Settings = z.infer<typeof settingsInput>;

export const restoreSettings = () => ipcRenderer.invoke('settings/restore') as Promise<Settings>;
