import { AssetId } from "shared/types";
import { z } from "zod";
import { Wallet } from "../../context/Workspace";
import { deriveKeys, DeriveKeysInput } from "../../lib/pythonClient";
import { deriveKeysInput } from "../../lib/schemas";

export type GetWalletsVariables = z.infer<typeof deriveKeysInput> & {
  assetId: AssetId;
};

const getAccountWallets = async (input: DeriveKeysInput) => {
  const { assetId } = input;

  const derivations = await deriveKeys(input);

  const accountWallets = await Promise.all(
    derivations.map<Promise<Wallet>>(async (data) => {
      const pathParts = data.path.split(",").map((p) => parseInt(p));
      const [purpose, coinType, accountId, change, index] = pathParts;

      return {
        assetId,
        pathParts,
        address: data.address,
        addressType: index > 0 ? "Deposit" : "Permanent",
        publicKey: data.pub,
        privateKey: data.prv,
        wif: data.wif,
      };
    })
  );

  return accountWallets;
};

export const getWallets = async ({
  assetId,
  accountIdStart,
  accountIdEnd,
  indexStart,
  indexEnd,
}: GetWalletsVariables) => {
  const wallets = [];

  const isTestnet = assetId.includes("_TEST");

  for (
    let accountId = accountIdStart;
    accountId <= accountIdEnd;
    accountId += 1
  ) {
    const input: DeriveKeysInput = {
      assetId,
      isTestnet,
      accountId,
      indexStart,
      indexEnd,
      legacy: false,
    };

    const accountWallets = await getAccountWallets(input);

    // Get additional legacy addresses for Bitcoin
    if (assetId === "BTC") {
      const legacyWallets = await getAccountWallets({
        ...input,
        legacy: true,
      });

      accountWallets.push(...legacyWallets);
    }

    wallets.push(...accountWallets);
  }

  return wallets;
};
