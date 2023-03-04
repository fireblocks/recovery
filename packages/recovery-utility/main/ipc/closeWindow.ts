import { ipcMain, BrowserWindow } from "electron";

ipcMain.on("window/close", (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);

  window?.close();
});
