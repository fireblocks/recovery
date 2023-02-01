import { AssetId, AssetType, SigningAlgorithm, AssetInfo } from "../types";

export const assetsInfo: Record<AssetId, AssetInfo> = {
  BTC: {
    id: AssetId.BTC,
    name: "Bitcoin",
    type: AssetType.UTXO,
    algorithm: SigningAlgorithm.MPC_ECDSA_SECP256K1,
    getExplorerUrl: (locator, type) =>
      `https://blockstream.info/${type}/${locator}`,
  },
  ETH: {
    id: AssetId.ETH,
    name: "Ethereum",
    type: AssetType.ACCOUNT,
    algorithm: SigningAlgorithm.MPC_ECDSA_SECP256K1,
    getExplorerUrl: (locator, type) =>
      `https://etherscan.io/${type}/${locator}`,
  },
  SOL: {
    id: AssetId.SOL,
    name: "Solana",
    type: AssetType.ACCOUNT,
    algorithm: SigningAlgorithm.MPC_EDDSA_ED25519,
    getExplorerUrl: (locator, type) =>
      `https://explorer.solana.com/${type}/${locator}`,
  },
};

export const getAssetInfo = (assetId?: string): AssetInfo => {
  const _assetId = assetId || "Unknown";

  const baseAssetId = _assetId.split("_TEST")[0] as AssetId;

  const assetInfo = assetsInfo[baseAssetId];

  if (!assetInfo) {
    return {
      id: _assetId as AssetId,
      name: _assetId,
      type: AssetType.ACCOUNT,
      algorithm: SigningAlgorithm.MPC_ECDSA_SECP256K1,
      getExplorerUrl: () => "",
    };
  }

  return assetInfo;
};

export const assetIds = Object.keys(assetsInfo) as AssetId[];

export const assets = assetIds.map((id) => assetsInfo[id]);
