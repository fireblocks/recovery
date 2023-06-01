import { assets } from './assets';

export const isAssetId = (assetId?: string): assetId is string => !!assetId && assetId in assets;

export const isNativeAssetId = (assetId?: string) => {
  const assetConfig = isAssetId(assetId) ? assets[assetId] : undefined;
  return !!(assetConfig && 'nativeAsset' in assetConfig && assetConfig.nativeAsset === assetId);
};

export const isDerivableAssetId = (assetId?: string) => {
  const assetConfig = isAssetId(assetId) ? assets[assetId] : undefined;
  return !!(assetConfig && 'derive' in assetConfig && assetConfig.derive);
};

export const getAssetConfig = (assetId?: string) => (isAssetId(assetId) ? assets[assetId] : undefined);

export const getNativeAssetConfig = <ID extends string>(assetId?: ID) =>
  isNativeAssetId(assetId) ? getAssetConfig(assetId) : (undefined as never);

export const getDerivableAssetConfig = <ID extends string>(assetId?: ID) =>
  isDerivableAssetId(assetId) ? getAssetConfig(assetId) : (undefined as never);
