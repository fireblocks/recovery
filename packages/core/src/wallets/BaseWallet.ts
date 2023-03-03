import {
  Input,
  DerivationInput,
  AddressInput,
  Derivation,
  Wallet,
} from "../types";

export abstract class BaseWallet {
  data: Wallet;

  constructor(input: Input, coinType: number, algorithm: "ECDSA" | "EDDSA") {
    const _coinType = input.isTestnet ? 1 : input.path.coinType ?? coinType;

    const _path = { ...input.path, coinType: _coinType };

    const _input = { ...input, path: _path };

    const _isXprvDerivation =
      typeof _input.xprv === "string" || typeof _input.fprv === "string";

    const isEdDSA = algorithm === "EDDSA";

    const xprvKey = isEdDSA ? "fprv" : "xprv";

    const xpubKey = isEdDSA ? "fpub" : "xpub";

    const extendedKey = _isXprvDerivation ? _input[xprvKey] : _input[xpubKey];

    if (!extendedKey) {
      throw new Error(
        `${algorithm} extended key is required (${xprvKey} or ${xpubKey})`
      );
    }

    const { assetId, path, isTestnet, isLegacy } = _input;

    const pathParts = [
      44,
      path.coinType ?? 0,
      path.account ?? 0,
      path.changeIndex ?? 0,
      path.addressIndex ?? 0,
    ] as [44, number, number, number, number];

    const derivation = this.derive({ extendedKey, pathParts });

    const { publicKey, evmAddress } = derivation;

    const address = this.getAddress({
      publicKey,
      evmAddress,
      isTestnet,
      isLegacy,
    });

    const publicWallet: Wallet = {
      assetId,
      path,
      address,
      publicKey,
      isTestnet,
      isLegacy,
    };

    if (_isXprvDerivation) {
      const privateWallet: Wallet = {
        ...publicWallet,
        privateKey: derivation.privateKey,
        wif: derivation.wif,
      };

      this.data = privateWallet;
    } else {
      this.data = publicWallet;
    }
  }

  abstract derive(derivationInput: DerivationInput): Derivation;

  abstract getAddress(derivation: AddressInput): string;
}
