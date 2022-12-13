export type AssetId = "BTC" | "ETH" | "SOL";

export type AssetInfo = {
  id: AssetId;
  name: string;
  derivation?: {
    utxo?: boolean;
    legacy?: boolean;
    checksum?: boolean;
    gas?: boolean;
  };
  getExplorerUrl: (locator: string, type: "tx" | "address") => string;
};

/**
 * String encrypted with AES-128-CBC
 */
export type EncryptedString = {
  iv: string;
  salt: string;
  data: string;
};

/**
 * Contract call transaction data
 */
type ContractCallInput = {
  abi: string;
  params: Record<string, string>;
};

/**
 * New transaction data
 */
export type TransactionInput = {
  to?: string;
  amount?: number;
  memo?: string;
  contractCall?: ContractCallInput;
};

/**
 * Relay URL input parameters
 */
export type RelayUrlInput = {
  assetId: AssetId;
  address: string;
  privateKey: string;
  tx?: TransactionInput;
};

/**
 * Relay URL parameters with optionally encrypted private key
 */
export type RelayUrlParameters = {
  adr: string;
  prv: EncryptedString | string;
  tx?: TransactionInput;
};
