import type { BaseWallet } from "@fireblocks/wallet-derivation";

export enum AssetId {
  BTC = "BTC",
  BTC_TEST = "BTC_TEST",
  ETH = "ETH",
  ETH_TEST3 = "ETH_TEST3",
  SOL = "SOL",
  SOL_TEST = "SOL_TEST",
}

export type AssetInfo = {
  id: string;
  name: string;
  type: string;
  contractAddress?: string;
  nativeAsset: string;
  decimals: number;
  isTestnet?: boolean;
  rpcURL?: string;
  explorerUrl?: string;
  attrs?: {
    utxo?: boolean;
    p2wpkh?: boolean;
  };
};

export type Wallet<T extends BaseWallet = BaseWallet> = {
  assetId: string;
  isTestnet: boolean;
  balance?: {
    native?: number;
    usd?: number;
  };
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
  state: "created" | "signed" | "submitted" | "error";
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
