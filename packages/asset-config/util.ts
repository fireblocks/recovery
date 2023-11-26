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

export const isTransferableAsset = (assetId?: string) => {
  const assetConfig = isAssetId(assetId) ? assets[assetId] : undefined;
  return !!(assetConfig && 'transfer' in assetConfig && assetConfig.transfer);
};
export const isTestnetAsset = (assetId?: string) => {
  const assetConfig = isAssetId(assetId) ? assets[assetId] : undefined;
  return !!(assetConfig && 'testnet' in assetConfig && assetConfig.testnet);
};

export const isExplorerUrl = (url: string) =>
  Object.keys(assets).some((assetId) => {
    const asset = assets[assetId];
    if (isNativeAssetId(assetId) && asset.getExplorerUrl) {
      return url.startsWith(asset.getExplorerUrl('tx')('')) || url.startsWith(asset.getExplorerUrl('address')(''));
    }
    return false;
  });

export const getAssetConfig = (assetId?: string) => (isAssetId(assetId) ? assets[assetId] : undefined);

export const getNativeAssetConfig = <ID extends string>(assetId?: ID) =>
  isNativeAssetId(assetId) ? getAssetConfig(assetId) : (undefined as never);

export const getDerivableAssetConfig = <ID extends string>(assetId?: ID) =>
  isDerivableAssetId(assetId) ? getAssetConfig(assetId) : (undefined as never);
