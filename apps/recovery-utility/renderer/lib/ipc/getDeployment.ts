import { ipcRenderer } from 'electron';

export const getDeployment = () => ipcRenderer.invoke('deployment/get') as Promise<'UTILITY' | 'RELAY' | null>;
