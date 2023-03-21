import type { BaseWallet } from '@fireblocks/wallet-derivation';

export type Wallet<T extends BaseWallet = BaseWallet> = {
  assetId: string;
  isTestnet: boolean;
  balance?: {
    native?: number;
    usd?: number;
  };
  lastUpdated?: Date;
  /** Map of addresses to derivations */
  derivations: Map<string, T>;
};

export type VaultAccount<T extends BaseWallet = BaseWallet> = {
  id: number;
  name: string;
  /** Map of asset IDs to wallets */
  wallets: Map<string, Wallet<T>>;
};

export type Transaction = {
  id: string;
  state: 'created' | 'signed' | 'submitted' | 'error';
  assetId: string;
  accountId: number;
  addressIndex: number;
  from: string;
  to: string;
  amount: number;
  remainingBalance?: number;
  memo?: string;
  contractCall?: {
    abi: string;
    params: Record<string, string>;
  };
  hex?: string;
  signature?: string;
  hash?: string;
  error?: string;
};
