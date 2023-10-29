export class AddressValidator {
  public isValidAddress(address: string, networkProtocol: string | undefined): boolean {
    function selectValidatorFunction(protocol: string | undefined): (address: string) => boolean {
      switch (protocol) {
        case 'ETH':
          return AddressValidator.isEthereumAddress;
        case 'BTC':
          return AddressValidator.isBitcoinAddress;
        case 'SOL':
          return AddressValidator.isSolanaAddress;
        case 'ADA':
          return AddressValidator.isCardanoAddress;
        case 'XLM':
          return AddressValidator.isStellarAddress;
        case 'XDB':
          return AddressValidator.isStellarAddress;
        case 'XTZ':
          return AddressValidator.isTezosAddress;
        case 'HBAR':
          return AddressValidator.isHederaAddress;
        case 'ALGO':
          return AddressValidator.isAlgorandAddress;
        case 'ATOM':
          return AddressValidator.isCosmosAddress;
        case 'EOS':
          return AddressValidator.isEosAddress;
        case 'DOT':
          return AddressValidator.isPolkadotAddress;
        case 'ETC':
          return AddressValidator.isEthereumClassicAddress;
        case 'TERRA':
          return AddressValidator.isTerraAddress;
        case 'TRX':
          return AddressValidator.isTronAddress;
        default:
          throw new Error('Unsupported networkProtocol or undefined' + protocol);
      }
    }

    const validatorFunction = selectValidatorFunction(networkProtocol);

    if (validatorFunction) {
      return validatorFunction(address);
    } else {
      throw new Error('Unsupported protocol');
    }
  }

  static isBitcoinAddress(address: string): boolean {
    if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) {
      // legacy address
      return true;
    } else if (/^bc1[0-9a-zA-Z]{25,39}$/.test(address)) {
      // segwit address
      return true;
    } else {
      return false;
    }
  }

  static isEthereumAddress(address: string): boolean {
    return /^(0x)?[0-9a-fA-F]{40}$/.test(address);
  }

  static isSolanaAddress(address: string): boolean {
    return /^sol1[0-9a-zA-Z]{55}$/.test(address);
  }

  static isCardanoAddress(address: string): boolean {
    return /^addr1[0-9a-zA-Z]{58}$/.test(address);
  }

  static isStellarAddress(address: string): boolean {
    return /^[GTS][0-9A-Z]{55}$/.test(address);
  }

  static isTezosAddress(address: string): boolean {
    return /^tz1[0-9A-Za-z]{33}$/.test(address);
  }

  static isHederaAddress(address: string): boolean {
    return /^0.0.[1-9][0-9]{0,8}$/.test(address);
  }

  static isAlgorandAddress(address: string): boolean {
    return /^[A-Z2-7]{58}$/.test(address);
  }

  static isCosmosAddress(address: string): boolean {
    return /^cosmos1[0-9a-zA-Z]{38}$/.test(address);
  }

  static isEosAddress(address: string): boolean {
    return /^[a-z1-5.]{12}$/.test(address);
  }

  static isPolkadotAddress(address: string): boolean {
    // TODO: regex not good, need to review base58 usage
    return false;
  }

  static isEthereumClassicAddress(address: string): boolean {
    return /^(0x)?[0-9a-fA-F]{40}$/.test(address);
  }

  static isTerraAddress(address: string): boolean {
    return /^terra1[0-9a-zA-Z]{38}$/.test(address);
  }

  static isTronAddress(address: string): boolean {
    return /^T[0-9a-zA-Z]{33}$/.test(address);
  }
}
