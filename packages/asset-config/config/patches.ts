import { AssetId } from '../types';

export type NativeAssetPatch = ChildAssetPatch & {
  /** If true asset is UTxO-based */
  readonly utxo?: boolean;
  /** If true asset has Segwit addresses which should be included with legacy derivations */
  readonly segwit?: boolean;
  /** Explorer base URL */
  readonly exp?: string;
  /**
   * Explorer path segment template
   *
   * * 0: Etherscan
   * * 1: Solana
   * * 2. Polkadot
   * * 3. Cosmos
   */
  readonly expPath?: 0 | 1 | 2 | 3;
};

export type ChildAssetPatch = {
  /** If true the asset's wallets can be recovered with @fireblocks/wallet-derivation */
  readonly derive?: boolean;
  /** RPC API URL */
  readonly rpc?: string;
};

export const nativeAssetPatches: { [ID in AssetId]?: NativeAssetPatch } = {
  BTC: {
    derive: true,
    utxo: true,
    segwit: true,
  },
  BTC_TEST: {
    derive: true,
    utxo: true,
    segwit: true,
  },
  ETH: {
    derive: true,
  },
  ETH_TEST3: {
    derive: true,
  },
  ETH_TEST5: {
    derive: true,
  },
  SOL: {
    derive: true,
  },
  ADA: {
    utxo: true,
    derive: true,
  },
  ADA_TEST: {
    utxo: true,
    derive: true,
  },
};

export const assetPatches: { [ID in AssetId]?: ChildAssetPatch } = {};
