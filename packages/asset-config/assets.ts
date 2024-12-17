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
  {},
);

export function getAllJettons(): string[] {
  const jettons = [];
  for (const asset of globalAssets) {
    if (asset.protocol === 'TON' && asset.address) {
      jettons.push(asset.id);
    }
  }
  return jettons;
}
