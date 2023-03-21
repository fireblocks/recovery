import { ipcRenderer } from 'electron';

export const handleRelayUrl = (onRelayUrl: (relayUrl: string) => void) =>
  ipcRenderer.on('relay-url', (event, args) => onRelayUrl(args as string));
