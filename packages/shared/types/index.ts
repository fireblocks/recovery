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
  getExplorerUrl: (locator: string, type: "tx" | "address") => string;
};

/**
 * Relay URL parameters with optionally encrypted private key
 */
export type RelayUrlParameters = {
  adr: string;
  prv: string;
};
