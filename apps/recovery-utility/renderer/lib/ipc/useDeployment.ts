import { ipcRenderer } from 'electron';

export const useDeployment = async (protocol: 'UTILITY' | 'RELAY') =>
  ipcRenderer.invoke('deployment/use', protocol) as Promise<void>;

export const resetDeployment = async () => ipcRenderer.invoke('deployment/reset') as Promise<void>;
