export enum AssetId {
  BTC = "BTC",
  ETH = "ETH",
  SOL = "SOL",
}

export enum AssetType {
  UTXO = "UTXO",
  ACCOUNT = "ACCOUNT",
}

export enum SigningAlgorithm {
  MPC_ECDSA_SECP256K1 = "MPC_ECDSA_SECP256K1",
  MPC_ECDSA_SECP256R1 = "MPC_ECDSA_SECP256R1",
  MPC_EDDSA_ED25519 = "MPC_EDDSA_ED25519",
}

export type AssetInfo = {
  id: AssetId;
  name: string;
  type: AssetType;
  algorithm: SigningAlgorithm;
  utxoUsage: boolean;
  getExplorerUrl: (locator: string, type: "tx" | "address") => string;
};

export type RelayWalletUrlParameters = {
  xpub?: string;
  fpub?: string;
  assetId?: AssetId;
  accountId?: number;
};

/**
 * [AssetId, balance, [account, changeIndex, addressIndex]][]
 */
export type RelayBalanceUpdateUrlParameters = [
  AssetId,
  number,
  [number, number, number]
][];

export type RelaySigningUrlParameters = {
  assetId: AssetId;
  from: string;
  to: string;
  balance: string;
  amount: number;
  memo?: string;
  additionalParameters?: unknown;
  txHex: string;
};

export type RelayBroadcastUrlParameters = {
  assetId: string;
  from: string;
  to: string;
  amount: number;
  txHex: string;
  signature: string;
};
