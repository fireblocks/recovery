import { Algorithm, HDPath, HDPathParts, Input, KeyDerivation, Derivation } from '../types';

export abstract class BaseWallet implements Derivation {
  /** Asset ID */
  public assetId: string;

  /** BIP44 path */
  public path: HDPath;

  /** BIP44 path parts */
  public pathParts: HDPathParts;

  /** Encoded address */
  public address: string;

  /** Memo/destination tag */
  public tag?: string;

  /** Address type */
  public type: 'Deposit' | 'Permanent';

  /** Address description */
  public description?: string;

  /** Derived public key hexadecimal string */
  public publicKey: string;

  /** Derived private key hexadecimal string */
  public privateKey?: string;

  /** Derived private key in Wallet Import Format (ECDSA) */
  public wif?: string;

  /** Is testnet asset */
  public isTestnet: boolean;

  /** Is legacy derivation (vs. Segwit) */
  public isLegacy: boolean;

  /** Balance */
  public balance: {
    native?: number;
    usd?: number;
  };

  /** Last updated date */
  public lastUpdated?: Date;

  constructor(input: Input, defaultCoinType: number, algorithm: Algorithm) {
    this.balance = {};
    this.assetId = input.assetId;
    this.isLegacy = input.isLegacy ?? false;
    this.isTestnet = input.isTestnet ?? false;

    this.path = {
      coinType: input.path.coinType ?? (this.isTestnet ? 1 : defaultCoinType),
      account: input.path.account ?? 0,
      changeIndex: input.path.changeIndex ?? 0,
      addressIndex: input.path.addressIndex ?? 0,
    };

    this.pathParts = [44, this.path.coinType, this.path.account, this.path.changeIndex, this.path.addressIndex];

    this.type = this.path.addressIndex > 0 ? 'Deposit' : 'Permanent';

    const isXprvDerivation = typeof input.xprv === 'string' || typeof input.fprv === 'string';

    const isEdDSA = algorithm === 'EDDSA';

    const xprvKey = isEdDSA ? 'fprv' : 'xprv';

    const xpubKey = isEdDSA ? 'fpub' : 'xpub';

    const extendedKey = isXprvDerivation ? input[xprvKey] : input[xpubKey];

    if (!extendedKey) {
      throw new Error(`${algorithm} extended key is required (${xprvKey} or ${xpubKey})`);
    }

    const { publicKey, evmAddress, privateKey, wif } = this.derive(extendedKey);

    this.publicKey = publicKey;

    if (isXprvDerivation) {
      this.privateKey = privateKey;
      this.wif = wif;
    }

    this.address = this.getAddress(evmAddress);
  }

  protected abstract derive(extendedKey: string): KeyDerivation;

  protected abstract getAddress(evmAddress?: string): string;
}
