import { inferAsyncReturnType } from "@trpc/server";
import { PythonServer } from "./python-server";

export const pythonServer = new PythonServer();

export const createContext = async () => ({ server: pythonServer });

export type Context = inferAsyncReturnType<typeof createContext>;
