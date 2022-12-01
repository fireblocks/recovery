// Source: https://github.com/jsonnull/electron-trpc

import type { Operation } from "@trpc/client";
import type { AnyRouter, inferRouterContext } from "@trpc/server";
import { ipcMain } from "electron";
import type { IpcMainInvokeEvent } from "electron";
import { resolveIPCResponse } from "./resolveIPCResponse";

export const createIPCHandler = <TRouter extends AnyRouter>({
  createContext,
  router,
}: {
  createContext?: () => Promise<inferRouterContext<TRouter>>;
  router: TRouter;
}) =>
  ipcMain.handle(
    "electron-trpc",
    (_event: IpcMainInvokeEvent, args: Operation) => {
      return resolveIPCResponse({ router, createContext, operation: args });
    }
  );
