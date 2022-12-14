import JSONCrush from "jsoncrush";
import { assetIds, AssetId, RelayUrlParameters } from "shared";
import { BaseWallet, WalletClasses } from "./wallets";

export const decodeUrl = (url = window.location.href) => {
  const [href, encodedParams] = url.split("#");

  const assetId = assetIds.find((assetId) => href.includes(`/${assetId}`));

  return { assetId, encodedParams: encodedParams as string | undefined };
};

export type ParsedUrlParams = {
  assetId: AssetId;
  address: string;
  encryptedPrivateKey: string;
  isTestnet: boolean;
  walletInstance: BaseWallet;
};

export const parseUrlParams = (assetId: AssetId, encodedParams: string) => {
  try {
    if (!assetId) {
      throw new Error("Invalid asset ID in URL");
    }

    if (!encodedParams) {
      throw new Error("No wallet data in URL");
    }

    const compressedParams = decodeURIComponent(encodedParams);

    const decompressedParams = JSONCrush.uncrush(compressedParams);

    const { adr: address, prv: encryptedPrivateKey } = JSON.parse(
      decompressedParams
    ) as RelayUrlParameters;

    const [baseAsset, assetSuffix] = assetId.split("_");

    const isTestnet = !!assetSuffix?.includes("TEST");

    const WalletClass = WalletClasses[baseAsset as AssetId];

    const walletInstance = new WalletClass(address, isTestnet);

    const parsedParams: ParsedUrlParams = {
      assetId,
      address,
      encryptedPrivateKey,
      isTestnet,
      walletInstance,
    };

    return parsedParams;
  } catch (error) {
    console.error(error);

    throw new Error("Invalid relay URL");
  }
};
