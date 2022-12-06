import { ipcMain, BrowserWindow } from "electron";

ipcMain.on("close-window", function (event) {
  const window = BrowserWindow.fromWebContents(event.sender);

  window?.close();
});
