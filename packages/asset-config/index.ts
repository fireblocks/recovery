import { assets as assetsConst } from './dist/assets';
import { isNativeAssetId, isDerivableAssetId } from './util';
import type { AssetId, AssetConfig } from './types';

export { getAssetConfig, getNativeAssetConfig, getDerivableAssetConfig, getExplorerUrl } from './util';

export type { AssetId, AssetConfig };

export const assetIds = Object.keys(assetsConst) as AssetId[];

export const assets = Object.values(assetsConst);

export const nativeAssets = assets.filter(({ id }) => isNativeAssetId(id));

export const derivableAssets = assets.filter(({ id }) => isDerivableAssetId(id));

export { isNativeAssetId, isDerivableAssetId };
