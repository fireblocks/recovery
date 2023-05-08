/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/first */
import * as dotenv from 'dotenv';

dotenv.config();

import { FireblocksSDK, AssetTypeResponse } from 'fireblocks-sdk';
import { symbolCoinTypeMap } from '../config/bip44';
import { explorers } from '../config/explorers';
import { assetPatches, nativeAssetPatches } from '../config/patches';
import { assets as existingAssets } from '../dist/assetsOld';
import { Assets, AssetsConfigConstant, AssetId } from '../types';
import { writeObject } from './writeObject';

const { FIREBLOCKS_API_KEY, FIREBLOCKS_API_PRIVATE_KEY } = process.env;

const getFireblocks = async () => {
  if (!FIREBLOCKS_API_PRIVATE_KEY) {
    throw new Error('FIREBLOCKS_API_PRIVATE_KEY environment variable not set');
  }

  if (!FIREBLOCKS_API_KEY) {
    throw new Error('FIREBLOCKS_API_KEY environment variable not set');
  }

  const fireblocks = new FireblocksSDK(FIREBLOCKS_API_PRIVATE_KEY, FIREBLOCKS_API_KEY);

  return fireblocks;
};

const mergeAssets = (assetsResponse: AssetTypeResponse[]) =>
  assetsResponse.reduce(
    (acc, asset) => {
      // Don't include FIAT assets
      if (asset.type === 'FIAT') {
        return acc;
      }

      const assetId = asset.id as AssetId;

      const nativeAssetId = asset.nativeAsset as AssetId;

      const isNativeAsset = assetId === nativeAssetId;

      const existingAsset = acc[assetId] as AssetTypeResponse;

      const nativeAssetPatch = isNativeAsset ? nativeAssetPatches[assetId as AssetId] : undefined;

      const assetPatch = assetPatches[assetId as AssetId];

      const baseId = asset.id.split('_')[0];

      const coinType = symbolCoinTypeMap[baseId as keyof typeof symbolCoinTypeMap];

      const explorer = explorers[assetId as keyof typeof explorers] as string;

      // Merge merged asset with existing asset and add asset patch
      const mergedAsset = {
        ...existingAsset,
        ...asset,
        ...(nativeAssetPatch as unknown as object),
        ...(assetPatch as object),
        coinType: isNativeAsset ? coinType : undefined,
        // Remove empty contract address strings ("")
        contractAddress: asset?.contractAddress || existingAsset?.contractAddress || undefined,
        // Add explorer URL to native assets
        exp: isNativeAsset && assetId in explorers ? explorer : undefined,
      } as AssetsConfigConstant[AssetId];

      return { ...acc, [assetId]: mergedAsset };
    },
    { ...existingAssets },
  ) as Assets;

export const buildAssets = async () => {
  try {
    const fireblocks = await getFireblocks();

    console.info('Getting all supported assets from Fireblocks...');

    const newAssets = await fireblocks.getSupportedAssets();

    const assets = mergeAssets(newAssets);

    await writeObject('assets', 'All assets on Fireblocks', assets);
  } catch (error) {
    console.error(error);
  }
};

buildAssets();
