import { assets } from "./assets";

export const supportedAssets = {
  BTC: {
    ...assets.BTC,
    utxo: true,
    p2wpkh: true,
  },
  BTC_TEST: {
    ...assets.BTC_TEST,
    utxo: true,
    p2wpkh: true,
  },
  ETH: assets.ETH,
  ETH_TEST3: assets.ETH_TEST3,
  SOL: assets.SOL,
  SOL_TEST: assets.SOL_TEST,
} as const;

export type SupportedAssetId = keyof typeof supportedAssets;

export type SupportedAsset<T extends SupportedAssetId = SupportedAssetId> =
  (typeof supportedAssets)[T];

export const supportedAssetIds = Object.keys(
  supportedAssets
) as SupportedAssetId[];

export const supportedAssetsArray =
  Object.values<SupportedAsset>(supportedAssets);
