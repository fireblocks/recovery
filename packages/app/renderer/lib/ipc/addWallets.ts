import { ipcRenderer } from "electron";

type AddWalletsVariables = {
  assetId: string;
  accountIdStart: number;
  accountIdEnd: number;
  indexStart: number;
  indexEnd: number;
  isLegacy: boolean;
  isChecksum: boolean;
};

export const addWallets = async ({
  assetId,
  accountIdStart,
  accountIdEnd,
  indexStart,
  indexEnd,
  isLegacy,
  isChecksum,
}: AddWalletsVariables) =>
  ipcRenderer.send("add-wallets", {
    assetId,
    accountIdStart,
    accountIdEnd,
    indexStart,
    indexEnd,
    isLegacy,
    isChecksum,
  });
