export type Algorithm = 'ECDSA' | 'EDDSA';

export type HDPath = Readonly<{
  coinType: number;
  account: number;
  changeIndex: number;
  addressIndex: number;
}>;

export type HDPathParts = [44, number, number, number, number];

export type HDPathInput = Partial<HDPath>;

export type ExtendedKeys = {
  xprv?: string;
  fprv?: string;
  xpub?: string;
  fpub?: string;
};

export type Input = Readonly<
  ExtendedKeys & {
    assetId: string;
    path: HDPathInput;
    isTestnet?: boolean;
    isLegacy?: boolean;
  }
>;

export type KeyDerivation = Readonly<{
  publicKey: string;
  privateKey?: string;
  wif?: string;
  evmAddress?: string;
}>;

export interface Derivation {
  /** Asset ID */
  assetId: string;

  /** BIP44 path */
  path: HDPath;

  /** BIP44 path parts */
  pathParts: HDPathParts;

  /** Memo/destination tag */
  tag?: string;

  /** Address type */
  type: 'Deposit' | 'Permanent';

  /** Derived public key hexadecimal string */
  publicKey: string;

  /** Derived private key hexadecimal string */
  privateKey?: string;

  /** Derived private key in Wallet Import Format (ECDSA) */
  wif?: string;

  /** Is testnet asset */
  isTestnet: boolean;

  /** Is legacy derivation (vs. Segwit) */
  isLegacy: boolean;

  /** Address description */
  description?: string;

  /** Encoded address */
  address: string;

  /** Balance */
  balance: {
    native?: number;
    usd?: number;
  };

  /** Last updated date */
  lastUpdated?: Date;
}
