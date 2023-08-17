import { ipcRenderer } from 'electron';

export const useDeployment = async (protocol: 'UTILITY' | 'RELAY') =>
  ipcRenderer.invoke('deployment/use', protocol) as Promise<void>;
