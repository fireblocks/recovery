import {
  Algorithm,
  Input,
  DerivationInput,
  AddressInput,
  Derivation,
  Wallet,
} from "../types";

export abstract class BaseWallet {
  input: Omit<Input, "xprv"> & { xprv?: never };

  data: Wallet;

  constructor(input: Input, defaultCoinType: number, algorithm: Algorithm) {
    this.input = { ...input, xprv: undefined, fprv: undefined };

    const path = {
      coinType: input.isTestnet ? 1 : defaultCoinType,
      account: 0,
      changeIndex: 0,
      addressIndex: 0,
      ...input.path,
    };

    const pathParts = [
      44,
      path.coinType,
      path.account,
      path.changeIndex,
      path.addressIndex,
    ] as const;

    const isXprvDerivation =
      typeof input.xprv === "string" || typeof input.fprv === "string";

    const isEdDSA = algorithm === "EDDSA";

    const xprv = isEdDSA ? input.fprv : input.xprv;

    const xpub = isEdDSA ? input.fpub : input.xpub;

    const extendedKey = isXprvDerivation ? xprv : xpub;

    if (!extendedKey) {
      throw new Error("Extended key is required (xprv or xpub)");
    }

    const { publicKey, evmAddress, privateKey, wif } = this.derive({
      extendedKey,
      pathParts,
    });

    const { assetId, isTestnet, isLegacy } = this.input;

    const address = this.getAddress({ publicKey, evmAddress });

    const publicWallet: Wallet = {
      assetId,
      path,
      address,
      publicKey,
      isTestnet,
      isLegacy,
    };

    if (isXprvDerivation) {
      const privateWallet: Wallet = {
        ...publicWallet,
        privateKey,
        wif,
      };

      this.data = privateWallet;
    } else {
      this.data = publicWallet;
    }
  }

  abstract derive(derivationInput: DerivationInput): Derivation;

  abstract getAddress(derivation: AddressInput): string;
}
