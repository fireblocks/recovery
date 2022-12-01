// Source: https://github.com/jsonnull/electron-trpc

import { TRPCClientError, TRPCLink, TRPCClientRuntime } from "@trpc/client";
import type {
  TRPCResponse,
  TRPCResponseMessage,
  TRPCResultMessage,
} from "@trpc/server/rpc";
import type { AnyRouter, inferRouterError } from "@trpc/server";
import { observable } from "@trpc/server/observable";

interface IPCResponse {
  response: TRPCResponse;
}

// from @trpc/client/src/links/internals/transformResult
// FIXME:
// - the generics here are probably unnecessary
// - the RPC-spec could probably be simplified to combine HTTP + WS
/** @internal */
const transformResult = <TRouter extends AnyRouter, TOutput>(
  response:
    | TRPCResponseMessage<TOutput, inferRouterError<TRouter>>
    | TRPCResponse<TOutput, inferRouterError<TRouter>>,
  runtime: TRPCClientRuntime
) => {
  if ("error" in response) {
    const error = runtime.transformer.deserialize(
      response.error
    ) as inferRouterError<TRouter>;
    return {
      ok: false,
      error: {
        ...response,
        error,
      },
    } as const;
  }

  const result = {
    ...response.result,
    ...((!response.result.type || response.result.type === "data") && {
      type: "data",
      data: runtime.transformer.deserialize(response.result.data) as unknown,
    }),
  } as TRPCResultMessage<TOutput>["result"];

  return { ok: true, result } as const;
};

export const ipcLink =
  <TRouter extends AnyRouter>(): TRPCLink<TRouter> =>
  (runtime) =>
  ({ op }) => {
    return observable((observer) => {
      const promise = (window as any).electronTRPC.rpc(
        op
      ) as Promise<IPCResponse>;

      promise
        .then((res) => {
          const transformed = transformResult(res.response, runtime);

          if (!transformed.ok) {
            observer.error(TRPCClientError.from(transformed.error));
            return;
          }
          observer.next({
            result: transformed.result,
          });
          observer.complete();
        })
        .catch((cause: Error) => observer.error(TRPCClientError.from(cause)));

      return () => {
        // cancel promise here
      };
    });
  };
