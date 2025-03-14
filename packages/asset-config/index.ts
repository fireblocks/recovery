import { orderId, orderAssetById } from './config/sort';
import { isNativeAssetId, isDerivableAssetId, isTestnetAsset } from './util';
import { assets, getAllJettons, getAllERC20s, getAllTRC20s } from './assets';

export { getAssetConfig, getNativeAssetConfig, getDerivableAssetConfig, isExplorerUrl } from './util';

export { assets, getAllJettons, getAllERC20s, getAllTRC20s };

export type * from './types';

export const assetIds = Object.keys(assets).sort(orderId);

export const assetsArray = Object.values(assets).sort(orderAssetById);

export const nativeAssets = assetsArray.filter(({ id }) => isNativeAssetId(id));

export const derivableAssets = assetsArray.filter(({ id }) => isDerivableAssetId(id));

export { isNativeAssetId, isDerivableAssetId, isTestnetAsset };
