import { ipcRenderer } from "electron";
import { z } from "zod";
import { settingsInput } from "../schemas";

type Settings = z.infer<typeof settingsInput>;

export const saveSettings = (settings: Settings) =>
  ipcRenderer.invoke("settings/save", settings) as Promise<void>;
