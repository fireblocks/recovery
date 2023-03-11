import { AssetConfig } from '@fireblocks/asset-config';
import { BaseWallet } from '@fireblocks/wallet-derivation';
import type { LocalFile } from 'papaparse';
import { RelayPath, RelayParams } from '../../lib/relayUrl';
import type { ExtendedKeys } from '../../schemas';
import type { VaultAccount, Transaction } from '../../types';

export type BaseWorkspace<T extends BaseWallet = BaseWallet> = {
  extendedKeys?: ExtendedKeys;
  asset?: AssetConfig;
  account?: VaultAccount<T>;
  accounts: Map<number, VaultAccount<T>>;
  transactions: Map<string, Transaction>;
};

export type BaseWorkspaceContext<T extends BaseWallet = BaseWallet> = BaseWorkspace<T> & {
  getRelayUrl: <P extends RelayPath = RelayPath>(path: P, params: RelayParams<P>) => string;
  restoreWorkspace: (extendedKeys?: Partial<ExtendedKeys>, csvFile?: LocalFile) => Promise<void>;
  setWorkspaceFromRelayUrl: <P extends RelayPath>(url: string) => { path: P; params: RelayParams<P> } | undefined;
  setExtendedKeys: (extendedKeys: ExtendedKeys) => void;
  setTransaction: (transaction: Transaction) => void;
  setAsset: (assetId: string) => void;
  setAccount: (accountId: number) => void;
  addAccount: (name: string, accountId?: number) => number;
  addWallet: (assetId: string, accountId: number, addressIndex?: number) => void;
  reset: () => void;
};
