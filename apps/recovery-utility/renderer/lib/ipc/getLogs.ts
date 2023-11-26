import { ipcRenderer } from 'electron';

export const getLogs = () => ipcRenderer.invoke('logs/get') as Promise<Buffer>;

export const getLogsPath = () => ipcRenderer.invoke('logs/get_path') as Promise<string>;

export const resetLogs = () => ipcRenderer.invoke('logs/reset') as Promise<void>;
