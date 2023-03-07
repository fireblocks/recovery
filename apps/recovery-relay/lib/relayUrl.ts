import JSONCrush from "jsoncrush";
import { AssetId, RelayWalletUrlParameters } from "@fireblocks/recovery-shared";
import { BaseWallet, WalletClasses } from "./wallets";

export const decodeUrl = (url = window.location.href) => {
  const encodedParams = url.split("#")[1];

  return encodedParams as string | undefined;
};

export type ParsedUrlParams = {
  assetId: AssetId;
  address: string;
  isTestnet: boolean;
  walletInstance: BaseWallet;
};

export const parseUrlParams = (encodedParams: string) => {
  try {
    if (!encodedParams) {
      throw new Error("No wallet data in URL");
    }

    const compressedParams = decodeURIComponent(encodedParams);

    const decompressedParams = JSONCrush.uncrush(compressedParams);

    const { assetId, xpub, accountId } = JSON.parse(
      decompressedParams
    ) as RelayWalletUrlParameters;

    // TODO: Redirect to prompt for assetId, xpub, or account ID if any parameters are missing
    if (!assetId || !xpub || !accountId) {
      throw new Error("Failed to parse relay URL");
    }

    // TODO: Match asset Ids to base networks and then match those to wallet classes
    const [baseAsset, assetSuffix] = assetId?.split("_") ?? [];

    const isTestnet = !!assetSuffix?.includes("TEST");

    const Wallet = WalletClasses[baseAsset as AssetId];

    const walletInstance = new Wallet(
      xpub,
      accountId,
      0, // changeIndex
      0, // addressIndex
      isTestnet,
      false // isLegacy
    );

    const parsedParams: ParsedUrlParams = {
      assetId,
      address: walletInstance.address,
      isTestnet,
      walletInstance: walletInstance as unknown as BaseWallet, // TODO: Fix types, remove BaseWallet
    };

    return parsedParams;
  } catch (error) {
    console.error(error);

    throw new Error("Invalid relay URL");
  }
};
