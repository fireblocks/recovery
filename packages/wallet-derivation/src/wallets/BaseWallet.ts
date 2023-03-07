import { Algorithm, HDPath, HDPathParts, Input, Derivation } from "../types";

export abstract class BaseWallet {
  /** Asset ID */
  public assetId: string;

  /** BIP44 path */
  public path: HDPath;

  /** Memo/destination tag */
  public tag?: string;

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

  /** Address description */
  public description?: string;

  /** Encoded address */
  public address: string;

  /** Balance */
  public balance?: number;

  /** Last updated date */
  public lastUpdated?: Date;

  /** BIP44 path parts */
  public get pathParts(): HDPathParts {
    return [
      44,
      this.path.coinType,
      this.path.account,
      this.path.changeIndex,
      this.path.addressIndex,
    ];
  }

  /** Address type */
  public get type() {
    return this.path.addressIndex > 0 ? "Deposit" : "Permanent";
  }

  constructor(input: Input, defaultCoinType: number, algorithm: Algorithm) {
    this.assetId = input.assetId;
    this.isLegacy = input.isLegacy ?? false;
    this.isTestnet = input.isTestnet ?? false;

    this.path = {
      coinType: this.isTestnet ? 1 : defaultCoinType,
      account: 0,
      changeIndex: 0,
      addressIndex: 0,
      ...input.path,
    };

    const isXprvDerivation =
      typeof input.xprv === "string" || typeof input.fprv === "string";

    const isEdDSA = algorithm === "EDDSA";

    const xprvKey = isEdDSA ? "fprv" : "xprv";

    const xpubKey = isEdDSA ? "fpub" : "xpub";

    const extendedKey = isXprvDerivation ? input[xprvKey] : input[xpubKey];

    if (!extendedKey) {
      throw new Error(
        `${algorithm} extended key is required (${xprvKey} or ${xpubKey})`
      );
    }

    const { publicKey, evmAddress, privateKey, wif } = this.derive(extendedKey);

    this.publicKey = publicKey;

    if (isXprvDerivation) {
      this.privateKey = privateKey;
      this.wif = wif;
    }

    this.address = this.getAddress(evmAddress);
  }

  protected abstract derive(extendedKey: string): Derivation;

  protected abstract getAddress(evmAddress?: string): string;
}
