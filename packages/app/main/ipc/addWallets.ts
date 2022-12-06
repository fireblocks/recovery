import { ipcMain } from "electron";
import { Wallet } from "../../renderer/context/Workspace";
import { SupportedAssetId } from "../../renderer/lib/assetInfo";
import { win, pythonServer } from "../background";

type AddWalletVariables = {
  assetId: SupportedAssetId;
  accountIdStart: string;
  accountIdEnd: string;
  indexStart: string;
  indexEnd: string;
  isLegacy: boolean;
  isChecksum: boolean;
};

type DeriveKeysResponse = {
  prv: string;
  pub: string;
  address: string;
  path: string;
};

ipcMain.on("add-wallets", async (event, args: AddWalletVariables) => {
  const {
    assetId,
    accountIdStart,
    accountIdEnd,
    indexStart,
    indexEnd,
    isLegacy,
    isChecksum,
  } = args;

  const wallets = [];

  for (
    let accountId = accountIdStart;
    accountId <= accountIdEnd;
    accountId += 1
  ) {
    // TODO: Make user configurable
    const [normalizedAssetId, assetIdTestSuffix] = assetId.split("_TEST");
    const isTestnet = !!assetIdTestSuffix;

    const searchParams = new URLSearchParams({
      asset: normalizedAssetId,
      account: String(accountId),
      change: "0",
      index_start: String(indexStart),
      index_end: String(indexEnd),
      xpub: "false",
      legacy: String(isLegacy),
      checksum: String(isChecksum),
      testnet: String(isTestnet),
    });

    const derivations = await pythonServer.request<DeriveKeysResponse[]>({
      url: `/derive-keys`,
      params: searchParams,
    });

    const accountWallets = derivations.map<Wallet>((data) => {
      const pathParts = data.path.split(",").map((p) => parseInt(p));
      const [purpose, coinType, accountId, change, index] = pathParts;

      return {
        assetId,
        pathParts,
        address: data.address,
        addressType: index > 0 ? "Deposit" : "Permanent",
        publicKey: data.pub,
        privateKey: data.prv,
      };
    });

    wallets.push(...accountWallets);
  }

  win?.webContents.send("add-wallets", wallets);
});
