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

export type Derivation = {
  pathParts: number[];
  address: string;
  type: "Permanent" | "Deposit";
  isTestnet: boolean;
  isLegacy?: boolean;
  description?: string;
  tag?: string;
  publicKey?: string;
  privateKey?: string;
  wif?: string;
};

export type Wallet = {
  assetId: AssetId;
  isTestnet: boolean;
  balance?: number;
  balanceUsd?: number;
  derivations: Map<string, Derivation>;
};

export type VaultAccount = {
  id: number;
  name: string;
  wallets: Map<AssetId, Wallet>;
};
