import { ipcRenderer } from "electron";
import { z } from "zod";
import { AssetId } from "shared";
import { deriveKeysInput } from "../schemas";

type Variables = z.infer<typeof deriveKeysInput> & { assetId: AssetId };

export const addWallets = async ({
  assetId,
  accountIdStart,
  accountIdEnd,
  indexStart,
  indexEnd,
}: Variables) =>
  ipcRenderer.send("add-wallets", {
    assetId,
    accountIdStart,
    accountIdEnd,
    indexStart,
    indexEnd,
  });
