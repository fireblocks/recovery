import { AssetId } from "@fireblocks/recovery-shared/types";
import { z } from "zod";
import {
  deriveWallet as baseDeriveWallet,
  Input,
} from "@fireblocks/wallet-derivation";
import type { Derivation } from "../context/Workspace";
import { deriveKeysInput } from "./schemas";

export type GetWalletsVariables = z.infer<typeof deriveKeysInput> & {
  xprv?: string;
  fprv?: string;
  assetId: AssetId;
  isLegacy?: boolean;
};

const getDerivationInputs = ({
  xprv,
  fprv,
  assetId,
  accountId,
  indexStart,
  indexEnd,
}: GetWalletsVariables) => {
  const isTestnet = assetId.includes("TEST");

  return Array.from(
    { length: indexEnd - indexStart + 1 },
    (_, i) =>
      ({
        xprv,
        fprv,
        assetId,
        path: {
          account: accountId,
          addressIndex: indexStart + i,
        },
        isTestnet,
        isLegacy: false,
      } as Input)
  );
};

export const deriveWallet = async (input: GetWalletsVariables) => {
  const inputs = getDerivationInputs(input);

  if (input.assetId.startsWith("BTC")) {
    inputs.push(...getDerivationInputs({ ...input, isLegacy: true }));
  }

  const derivations = (
    await Promise.all(inputs.map(baseDeriveWallet))
  ).map<Derivation>((data) => ({
    pathParts: [
      44,
      data.path.coinType,
      data.path.account,
      data.path.changeIndex,
      data.path.addressIndex,
    ],
    address: data.address,
    type: data.path.addressIndex > 0 ? "Deposit" : "Permanent",
    description: undefined,
    tag: undefined,
    publicKey: data.publicKey,
    privateKey: data.privateKey,
    wif: data.wif,
  }));

  return derivations;
};
