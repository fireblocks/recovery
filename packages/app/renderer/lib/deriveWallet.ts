import { AssetId } from "shared/types";
import { z } from "zod";
import { Wallet, Derivation } from "../context/Workspace";
import { deriveKeys, DeriveKeysInput } from "./pythonClient";
import { deriveKeysInput } from "./schemas";

export type GetWalletsVariables = z.infer<typeof deriveKeysInput> & {
  assetId: AssetId;
};

const deriveAddresses = async (input: DeriveKeysInput) => {
  const derivations = await deriveKeys(input);

  const addresses = await Promise.all(
    derivations.map<Promise<Derivation>>(async (data) => {
      const pathParts = data.path.split(",").map((p) => parseInt(p));
      const [purpose, coinType, accountId, change, index] = pathParts;

      return {
        pathParts,
        address: data.address,
        type: index > 0 ? "Deposit" : "Permanent",
        description: undefined,
        tag: undefined,
        publicKey: data.pub,
        privateKey: data.prv,
        wif: data.wif,
      };
    })
  );

  return addresses;
};

export const deriveWallet = async ({
  assetId,
  accountId,
  indexStart,
  indexEnd,
}: GetWalletsVariables) => {
  const isTestnet = assetId.includes("_TEST");

  const input: DeriveKeysInput = {
    assetId,
    isTestnet,
    accountId,
    indexStart,
    indexEnd,
    legacy: false,
  };

  const derivations = await deriveAddresses(input);

  // Get additional legacy addresses for Bitcoin
  if (assetId.includes("BTC")) {
    const legacyWallets = await deriveAddresses({
      ...input,
      legacy: true,
    });

    derivations.push(...legacyWallets);
  }

  return derivations;
};
