import { orderId, orderAssetById } from './config/sort';
import { isNativeAssetId, isDerivableAssetId } from './util';
import { assets } from './assets';

export { getAssetConfig, getNativeAssetConfig, getDerivableAssetConfig } from './util';

export { assets };

export type * from './types';

export const assetIds = Object.keys(assets).sort(orderId);

export const assetsArray = Object.values(assets).sort(orderAssetById);

export const nativeAssets = assetsArray.filter(({ id }) => isNativeAssetId(id));

export const derivableAssets = assetsArray.filter(({ id }) => isDerivableAssetId(id));

export { isNativeAssetId, isDerivableAssetId };
