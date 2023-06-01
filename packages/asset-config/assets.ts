import { globalAssets } from './data/globalAssets';
import { nativeAssetPatches } from './config/patches';
import { AssetsConfig } from './types';

export const assets = globalAssets.reduce<AssetsConfig>(
  (acc, asset) => ({
    ...acc,
    [asset.id]: {
      ...asset,
      ...nativeAssetPatches[asset.nativeAsset],
    },
  }),
  {} as AssetsConfig,
);
