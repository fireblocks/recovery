import { type globalAssets } from './data/globalAssets';

type RawAssets = typeof globalAssets;
type RawAsset = RawAssets[number];

export type NativeAssetId = RawAsset['nativeAsset'];

export type GetExplorerUrl = (type: 'tx' | 'address') => (value: string) => string;

export type NativeAssetPatch = {
  derive?: boolean;
  transfer?: boolean;
  utxo?: boolean;
  segwit?: boolean;
  minBalance?: boolean | number;
  memo?: boolean;
  rpcUrl?: string;
  getExplorerUrl?: GetExplorerUrl;
};

export type NativeAssetPatches = Partial<Record<NativeAssetId, NativeAssetPatch>>;

export type AssetConfig = RawAsset & NativeAssetPatch;

export type AssetsConfig = Record<string, AssetConfig>;

export type NativeAssetsConfig = Record<NativeAssetId, AssetConfig>;
