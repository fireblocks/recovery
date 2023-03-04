import { ipcMain } from "electron";
import { SettingsStore } from "../store/settings";

ipcMain.handle("settings/restore", (event) => SettingsStore.get());
