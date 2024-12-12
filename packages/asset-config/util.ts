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

export const isExplorerUrl = (url: string) => {
  const endingsToRemove: { [key: string]: string } = { SOL: '?cluster=mainnet', SOL_TEST: '?cluster=devnet' };
  return Object.keys(assets).some((assetId: string) => {
    const asset = assets[assetId];
    if (isNativeAssetId(assetId) && asset.getExplorerUrl) {
      const txUrl =
        assetId in endingsToRemove
          ? asset.getExplorerUrl('tx')('').replace(endingsToRemove[assetId], '')
          : asset.getExplorerUrl('tx')('');
      const addressUrl =
        assetId in endingsToRemove
          ? asset.getExplorerUrl('address')('').replace(endingsToRemove[assetId], '')
          : asset.getExplorerUrl('address')('');
      return url.startsWith(addressUrl) || url.startsWith(txUrl);
    }
    return false;
  });
};

export const getAssetConfig = (assetId?: string) => (isAssetId(assetId) ? assets[assetId] : undefined);

export const isTransferableToken = (assetId?: string) => {
  if (!isAssetId) return false;
  const assetConfig = assets[assetId!];

  // Is this a non-native asset, has a contract / address that represents it (i.e token) and we enabled the transfer option
  return assetConfig.nativeAsset !== assetConfig.id && assetConfig.address && assetConfig.transfer;
};

export const getNetworkProtocol = (assetId: string) => getAssetConfig(assetId)?.protocol;

export const getNativeAssetConfig = <ID extends string>(assetId?: ID) =>
  isNativeAssetId(assetId) ? getAssetConfig(assetId) : (undefined as never);

export const getDerivableAssetConfig = <ID extends string>(assetId?: ID) =>
  isDerivableAssetId(assetId) ? getAssetConfig(assetId) : (undefined as never);
