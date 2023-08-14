import { ipcRenderer } from 'electron';

export const saveDeployment = async (protocol: 'UTILITY' | 'RELAY') =>
  ipcRenderer.invoke('deployment/save', protocol) as Promise<void>;
