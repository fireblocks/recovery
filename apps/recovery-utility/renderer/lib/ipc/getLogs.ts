import { ipcRenderer } from 'electron';

export const getLogs = () => ipcRenderer.invoke('logs/get') as Promise<Buffer>;
