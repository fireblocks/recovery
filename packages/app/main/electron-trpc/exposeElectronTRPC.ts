// Source: https://github.com/jsonnull/electron-trpc

import type { Operation } from "@trpc/client";
import { ipcRenderer, contextBridge } from "electron";

export const exposeElectronTRPC = () =>
  contextBridge.exposeInMainWorld("electronTRPC", {
    rpc: (args: Operation) => ipcRenderer.invoke("electron-trpc", args),
  });
