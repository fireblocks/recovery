import { contextBridge, ipcRenderer } from "electron";
import fs from "fs";
import Store from "secure-electron-store";

// Create the electron store to be made available in the renderer process
const store = new Store();

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("api", {
  store: store.preloadBindings(ipcRenderer, fs),
});
