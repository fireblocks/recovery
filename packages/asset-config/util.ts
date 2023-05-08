import { assets } from './dist/assetsOld';
import type { AssetId, AssetConfig } from './types';

export const isAssetId = (assetId?: string): assetId is AssetId => !!assetId && assetId in assets;

export const isNativeAssetId = (assetId?: string) => {
  const assetConfig = assetId ? assets[assetId as AssetId] : undefined;
  return !!(assetConfig && 'nativeAsset' in assetConfig && assetConfig.nativeAsset === assetId);
};

export const isDerivableAssetId = (assetId?: string) => {
  const assetConfig = assetId ? assets[assetId as AssetId] : undefined;
  return !!(assetConfig && 'derive' in assetConfig && assetConfig.derive);
};

export const getAssetConfig = <ID extends string>(assetId?: ID): AssetConfig<ID> => {
  if (!isAssetId(assetId)) {
    return undefined as never;
  }

  const assetConfig = assets[assetId as AssetId];

  if (isNativeAssetId(assetId)) {
    return { ...assetConfig, nativeAsset: undefined } as AssetConfig<ID>;
  }

  return { ...assetConfig, nativeAsset: getAssetConfig(assetConfig.nativeAsset) } as AssetConfig<ID>;
};

export const getNativeAssetConfig = <ID extends string>(assetId?: ID) =>
  isNativeAssetId(assetId) ? getAssetConfig(assetId) : (undefined as never);

export const getDerivableAssetConfig = <ID extends string>(assetId?: ID) =>
  isDerivableAssetId(assetId) ? getAssetConfig(assetId) : (undefined as never);

export const getExplorerUrl = <Host extends string, Type extends 'address' | 'tx' | 'contract' | 'token', Locator extends string>(
  host: Host,
  type: Type,
  locator: Locator,
) => `https://${host}/${type}/${locator}` as const;
