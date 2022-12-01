import { deriveKeysInput, recoverKeysInput } from "../../schemas";
import { t } from "./trpc";

type DerivationDetails = {
  prv: string;
  pub: string;
  address: string;
  path: string;
};

type MasterKeyDetails = {
  xprv: string;
  fprv: string;
  xpub: string;
  fpub: string;
};

export const appRouter = t.router({
  deriveKeys: t.procedure
    .input(deriveKeysInput)
    .mutation(async ({ ctx, input }) => {
      const data = await ctx.server.request<DerivationDetails[]>({
        url: "/derive-keys",
        params: {
          asset: input.asset,
          account: input.account,
          change: input.change,
          index_start: input.indexStart,
          index_end: input.indexEnd,
          use_xpub: input.useXpub,
          legacy: input.legacy,
          checksum: input.checksum,
          testnet: input.testnet,
        },
      });

      return data;
    }),
  recoverKeys: t.procedure
    .input(recoverKeysInput)
    .mutation(async ({ ctx, input }) => {
      const data = await ctx.server.request<MasterKeyDetails>({
        url: "/recover-keys",
        method: "POST",
        data: {
          zip: input.zip,
          passphrase: input.passphrase,
          "rsa-key": input.rsaKey,
          "rsa-key-passphrase": input.rsaKeyPassphrase,
        },
      });

      return data;
    }),
});

export type AppRouter = typeof appRouter;
