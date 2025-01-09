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

export function getAllERC20s(): string[] {
  const erc20Tokens = [];
  for (const asset of globalAssets) {
    if (asset.protocol === 'ETH' && asset.address) {
      erc20Tokens.push(asset.id);
    }
  }
  return erc20Tokens;
}

export function getAllTRC20s(): string[] {
  const trc20s = [];
  for (const asset of globalAssets) {
    if (asset.protocol === 'TRX' && asset.address) {
      trc20s.push(asset.id);
    }
  }
  return trc20s;
}
