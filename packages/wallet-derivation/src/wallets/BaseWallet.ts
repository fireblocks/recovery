import { Algorithm, HDPath, HDPathParts, Input, Derivation } from "../types";

export abstract class BaseWallet {
  private internalAddress?: string;

  private internalEvmAddress?: string;

  public assetId: string;

  public path: HDPath;

  public publicKey: string;

  public privateKey?: string;

  public wif?: string;

  public isTestnet: boolean;

  public isLegacy: boolean;

  public get pathParts(): HDPathParts {
    return [
      44,
      this.path.coinType,
      this.path.account,
      this.path.changeIndex,
      this.path.addressIndex,
    ];
  }

  public get address() {
    if (this.internalAddress) {
      return this.internalAddress;
    }

    this.internalAddress = this.getAddress(this.internalEvmAddress);

    this.internalEvmAddress = undefined;

    return this.internalAddress;
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
    this.internalEvmAddress = evmAddress;

    if (isXprvDerivation) {
      this.privateKey = privateKey;
      this.wif = wif;
    }
  }

  protected abstract derive(extendedKey: string): Derivation;

  protected abstract getAddress(evmAddress?: string): string;
}
