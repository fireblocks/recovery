import type { assets } from './dist/assetsOld';

/** Full asset config */
export type AssetsConfigConstant = typeof assets;

/** Asset ID */
export type AssetId = keyof AssetsConfigConstant;

/** Typed asset config */
export type AssetConfig<ID extends string = AssetId> = ID extends AssetId
  ? ResolvedAssetConfig<ID>
  : string extends ID
  ? ResolvedAssetConfig<AssetId> | undefined
  : never;

type ResolvedAssetConfig<ID extends AssetId> = Omit<AssetsConfigConstant[ID], 'nativeAsset'> & {
  nativeAsset?: Omit<ResolvedAssetConfig<AssetId>, 'nativeAsset'>;
};

/** Typed full asset config */
export type Assets = {
  [ID in AssetId]?: AssetsConfigConstant[ID];
};
