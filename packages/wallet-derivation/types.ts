import { RelayExtendedKeys, UtilityExtendedKeys } from '@fireblocks/recovery-shared';

export type Algorithm = 'ECDSA' | 'EDDSA';

export type HDPath = Readonly<{
  coinType: number;
  account: number;
  changeIndex: number;
  addressIndex: number;
}>;

export type HDPathParts = [44, number, number, number, number];

export type HDPathInput = Partial<HDPath>;

export type Input = Readonly<
  (UtilityExtendedKeys | RelayExtendedKeys) & {
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

export type NCWalletShare = {
  chainCode: string;
  shares: { cosigner: string; MPC_CMP_ECDSA_SECP256K1: string }[];
};

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
}
