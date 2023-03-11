import { ipcRenderer } from 'electron';
import type { Args } from '../../../main/ipc/recoverExtendedKeys/input';

export type ExtendedKeys = {
  xpub: string;
  fpub: string;
  xprv?: string;
  fprv?: string;
};

export const recoverExtendedKeys = (args: Args) => ipcRenderer.invoke('extended-keys/recover', args) as Promise<ExtendedKeys>;
