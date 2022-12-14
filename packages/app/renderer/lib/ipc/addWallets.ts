import { ipcRenderer } from "electron";
import { z } from "zod";
import { AssetId } from "shared";
import { deriveKeysInput } from "../schemas";

type Variables = z.infer<typeof deriveKeysInput> & {
  assetId: AssetId;
  isTestnet: boolean;
};

export const addWallets = async ({
  assetId,
  isTestnet,
  accountIdStart,
  accountIdEnd,
  indexStart,
  indexEnd,
}: Variables) =>
  ipcRenderer.send("add-wallets", {
    assetId,
    isTestnet,
    accountIdStart,
    accountIdEnd,
    indexStart,
    indexEnd,
  });
