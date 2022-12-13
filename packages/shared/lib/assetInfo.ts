import { AssetId, AssetInfo } from "../types";

export const assetsInfo: Record<AssetId, AssetInfo> = {
  BTC: {
    id: "BTC",
    name: "Bitcoin",
    derivation: {
      utxo: true,
      legacy: true,
      checksum: false,
      gas: false,
    },
    getExplorerUrl: (locator, type) =>
      `https://blockstream.info/${type}/${locator}`,
  },
  ETH: {
    id: "ETH",
    name: "Ethereum",
    derivation: {
      utxo: false,
      legacy: false,
      checksum: true,
      gas: true,
    },
    getExplorerUrl: (locator, type) =>
      `https://etherscan.io/${type}/${locator}`,
  },
  SOL: {
    id: "SOL",
    name: "Solana",
    derivation: {
      utxo: false,
      legacy: false,
      checksum: false,
      gas: false,
    },
    getExplorerUrl: (locator, type) =>
      `https://explorer.solana.com/${type}/${locator}`,
  },
};

export const getAssetInfo = (assetId?: string) => {
  if (!assetId) {
    throw new Error(`Unsupported asset: ${assetId}}`);
  }

  const normalizedAssetId = assetId.split("_TEST")[0] as AssetId;

  return assetsInfo[normalizedAssetId];
};

export const assetIds = Object.keys(assetsInfo) as AssetId[];

export const assets = assetIds.map((id) => assetsInfo[id]);
