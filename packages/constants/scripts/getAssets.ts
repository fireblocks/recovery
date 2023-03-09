/* eslint-disable import/first */
import * as dotenv from "dotenv";

dotenv.config();

import path from "path";
import { FireblocksSDK, AssetTypeResponse } from "fireblocks-sdk";
import { explorers } from "../explorers";
import { assets as existingAssets } from "../assets";
import { writeObject } from "./writeObject";

type StaticAsset = (typeof existingAssets)[keyof typeof existingAssets];

const rootDir = path.join(__dirname, "..");
const assetsPath = path.join(rootDir, "assets.ts");
const nativeAssetIdsPath = path.join(rootDir, "nativeAssetIds.ts");

const { FIREBLOCKS_API_KEY, FIREBLOCKS_API_PRIVATE_KEY } = process.env;

const getFireblocks = async () => {
  if (!FIREBLOCKS_API_PRIVATE_KEY) {
    throw new Error("FIREBLOCKS_API_PRIVATE_KEY environment variable not set");
  }

  if (!FIREBLOCKS_API_KEY) {
    throw new Error("FIREBLOCKS_API_KEY environment variable not set");
  }

  const fireblocks = new FireblocksSDK(
    FIREBLOCKS_API_PRIVATE_KEY,
    FIREBLOCKS_API_KEY
  );

  return fireblocks;
};

const mergeAssets = (assetsResponse: AssetTypeResponse[]) =>
  assetsResponse.reduce(
    (acc, asset) => {
      // Don't include FIAT assets
      if (asset.type === "FIAT") {
        return acc;
      }

      const assetId = asset.id as keyof typeof existingAssets;

      const nativeAssetId = asset.nativeAsset as keyof typeof explorers;

      const existingAsset = acc[assetId] as AssetTypeResponse | undefined;

      const explorerUrl =
        nativeAssetId in explorers ? explorers[nativeAssetId] : undefined;

      const mergedAsset = {
        ...existingAsset,
        ...asset,
        explorerUrl,
      } as StaticAsset;

      return { ...acc, [assetId]: mergedAsset };
    },
    { ...existingAssets }
  );

const getNativeAssetIds = (assets: typeof existingAssets) => {
  const assetsResponse = Object.values(assets);

  const nativeAssetIds = assetsResponse.map(({ nativeAsset }) => nativeAsset);

  return Array.from(new Set(nativeAssetIds)).sort((a, b) => a.localeCompare(b));
};

/**
 * Get all supported assets from Fireblocks, and update assets.ts
 */
export const getAssets = async () => {
  const fireblocks = await getFireblocks();

  console.info("Getting all supported assets from Fireblocks...");

  const newAssets = await fireblocks.getSupportedAssets();

  const assets = mergeAssets(newAssets);

  await writeObject(
    assetsPath,
    "assets",
    "All supported assets on Fireblocks",
    assets
  );

  const nativeAssetIds = getNativeAssetIds(assets);

  await writeObject(
    nativeAssetIdsPath,
    "nativeAssetIds",
    "All supported native asset IDs on Fireblocks",
    nativeAssetIds
  );
};

getAssets();
