import { assets } from "@fireblocks/recovery-constants/assets";
import {
  supportedAssets,
  SupportedAsset,
  SupportedAssetId,
} from "@fireblocks/recovery-constants/supportedAssets";

type AssetId = keyof typeof assets;

export type StaticAsset<T extends AssetId = AssetId> = (typeof assets)[T];

export type { SupportedAsset };

export type Asset = {
  id: string;
  name: string;
  type: StaticAsset["type"];
  contractAddress?: string;
  nativeAsset: StaticAsset["nativeAsset"];
  decimals: number;
  isTestnet?: boolean;
  rpcURL?: string;
  explorerUrl?: StaticAsset["explorerUrl"];
  utxo?: boolean;
  p2wpkh?: boolean;
};

export const assetIds = Object.keys(assets) as AssetId[];

export const assetsList = Object.values<StaticAsset>(assets);

export const getSupportedAsset = <T extends string>(assetId: T) =>
  supportedAssets[assetId as SupportedAssetId] as T extends SupportedAssetId
    ? SupportedAsset<T>
    : Asset | undefined;

export const getAsset = <T extends string>(assetId: T) =>
  (supportedAssets[assetId as SupportedAssetId] ??
    assets[assetId as AssetId]) as T extends SupportedAssetId
    ? SupportedAsset<T>
    : T extends AssetId
    ? StaticAsset<T>
    : Asset | undefined;

export const getExplorerUrl = <
  Host extends string,
  Type extends "address" | "tx" | "contract" | "token",
  Locator extends string
>(
  host: Host,
  type: Type,
  locator: Locator
) => `https://${host}/${type}/${locator}` as const;
