import { globalAssets } from './data/globalAssets';
import { nativeAssetPatches } from './config/patches';
import { AssetsConfig } from './types';
import { splAssets } from '../../apps/recovery-relay/lib/wallets/SPL/solana_assets';
import { unsupportedSplAssets } from '../../apps/recovery-relay/lib/wallets/SPL/unsupported_solana_assets';

// Transform SPL assets to match globalAssets structure
function transformSplAssets(splAssetsList: any[]) {
  return splAssetsList.map((asset) => ({
    id: asset.legacyId,
    symbol: asset.onchain.symbol,
    name: asset.onchain.name,
    decimals: asset.onchain.decimals ?? 6,
    address: asset.onchain.address,
    nativeAsset: 'SOL',
    protocol: 'SOL',
    testnet: false,
  }));
}

const allSplAssets = [...splAssets, ...unsupportedSplAssets];
const transformedSplAssets = transformSplAssets(allSplAssets);
const allAssets = [...globalAssets, ...transformedSplAssets];

// Remove duplicates by ID (prioritize globalAssets over SPL assets)
const uniqueAssets = allAssets.reduce((acc, asset) => {
  if (!acc.find((existing) => existing.id === asset.id)) {
    acc.push(asset);
  }
  return acc;
}, [] as typeof allAssets);

export const assets = uniqueAssets.reduce<AssetsConfig>(
  (acc, asset) => ({
    ...acc,
    [asset.id]: {
      ...asset,
      ...nativeAssetPatches[asset.nativeAsset],
    },
  }),
  {},
);

export function getAllSpls(): string[] {
  const splTokens = [];
  const allSplAssets = [...splAssets, ...unsupportedSplAssets];
  for (const asset of allSplAssets) {
    if (asset.blockchainId === 'dd754e7a-f4d5-466b-a847-45f31d4e5403' && asset.onchain.address) {
      splTokens.push(asset.legacyId);
    }
  }
  return splTokens;
}

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
