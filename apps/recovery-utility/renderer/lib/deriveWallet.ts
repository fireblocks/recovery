import { AssetId } from "@fireblocks/recovery-shared/types";
import { z } from "zod";
import {
  deriveWallet as baseDeriveWallet,
  Input,
} from "@fireblocks/wallet-derivation";
import { deriveKeysInput } from "./schemas";

export type GetWalletsVariables = z.infer<typeof deriveKeysInput> & {
  xprv?: string;
  fprv?: string;
  assetId: AssetId;
  isLegacy?: boolean;
  isTestnet?: boolean;
};

const getDerivationInputs = ({
  xprv,
  fprv,
  accountId,
  indexStart,
  indexEnd,
  assetId,
  isTestnet,
  isLegacy,
}: GetWalletsVariables) =>
  Array.from(
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
        isLegacy,
      } as Input)
  );

export const deriveWallet = (input: GetWalletsVariables) => {
  const inputs = getDerivationInputs(input);

  if (input.assetId.startsWith("BTC")) {
    inputs.push(...getDerivationInputs({ ...input, isLegacy: true }));
  }

  const derivations = inputs.map(baseDeriveWallet);

  return derivations;
};
