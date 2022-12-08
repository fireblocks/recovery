import { ipcRenderer } from "electron";

export const closeWindow = () => ipcRenderer.send("window/close");
