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
type TransactionInput = {
  to?: string;
  amount?: number;
  memo?: string;
  contractCall?: ContractCallInput;
};

/**
 * Relay URL input parameters
 */
export type RelayUrlInput = {
  assetId: string;
  privateKey: string;
  publicKey: string;
  tx?: TransactionInput;
};

/**
 * Relay URL parameters with optionally encrypted private key
 */
export type RelayUrlParameters = {
  assetId: string;
  privateKey: EncryptedString | string;
  publicKey: string;
  tx?: TransactionInput;
};
