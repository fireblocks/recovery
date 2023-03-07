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

  const derivations = inputs
    .map(baseDeriveWallet)
    .map<Derivation>((wallet) => ({
      isTestnet: wallet.isTestnet,
      isLegacy: wallet.isLegacy,
      pathParts: wallet.pathParts,
      address: wallet.address,
      type: wallet.path.addressIndex > 0 ? "Deposit" : "Permanent",
      description: undefined,
      tag: undefined,
      publicKey: wallet.publicKey,
      privateKey: wallet.privateKey,
      wif: wallet.wif,
    }));

  return derivations;
};
