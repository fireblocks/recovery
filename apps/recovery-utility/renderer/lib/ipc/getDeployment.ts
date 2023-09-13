import { ipcRenderer } from 'electron';

export const getDeployment = () =>
  ipcRenderer.invoke('deployment/get') as Promise<{ protocol: 'UTILITY' | 'RELAY' | null; exp: number }>;
