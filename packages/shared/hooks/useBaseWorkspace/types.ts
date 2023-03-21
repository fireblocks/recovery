import { BaseWallet } from '@fireblocks/wallet-derivation';
import type { LocalFile } from 'papaparse';
import type { ExtendedKeys, RelayRequestParams, RelayResponseParams } from '../../schemas';
import type { VaultAccount, Transaction, Wallet } from '../../types';

export type BaseWorkspaceInput<Derivation extends BaseWallet = BaseWallet> = {
  extendedKeys?: ExtendedKeys;
  accounts: Map<number, VaultAccount<Derivation>>;
  transactions: Map<string, Transaction>;
};

export type BaseWorkspace<
  Derivation extends BaseWallet = BaseWallet,
  App extends 'utility' | 'relay' = 'utility',
> = BaseWorkspaceInput<Derivation> & {
  account?: VaultAccount<Derivation>;
  inboundRelayParams?: App extends 'utility' ? RelayResponseParams : RelayRequestParams;
};

export type BaseWorkspaceContext<
  Derivation extends BaseWallet = BaseWallet,
  App extends 'utility' | 'relay' = 'utility',
> = BaseWorkspace<Derivation, App> & {
  setInboundRelayUrl: (relayUrl: string | null) => void;
  getOutboundRelayUrl: <Params extends App extends 'utility' ? RelayRequestParams : RelayResponseParams>(
    params: Params,
  ) => string;
  setExtendedKeys: (extendedKeys: ExtendedKeys) => void;
  importCsv: (addressesCsv?: LocalFile, balancesCsv?: LocalFile) => Promise<void>;
  setTransaction: (transaction: Transaction) => void;
  addAccount: (name: string, accountId?: number) => number;
  addWallet: (assetId: string, accountId: number, addressIndex?: number) => Wallet<Derivation> | undefined;
  setWalletBalance: (assetId: string, accountId: number, balance: number) => void;
  reset: () => void;
};
