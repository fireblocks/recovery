import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../main/api/_app";

export const trpc = createTRPCReact<AppRouter>();
