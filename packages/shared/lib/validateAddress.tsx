import * as WAValidator from 'multicoin-address-validator';
export class AddressValidator {
  public isValidAddress(address: string, networkProtocol: string | undefined, assetId: string): boolean {
    // XinFin is the only EVM with 'xdc' prefix instead of '0x'
    if (assetId == 'XDC') {
      return this.validateXDC(address, 'ETH');
    }

    if (this.doesValidatorExist(networkProtocol)) {
      const isValid = WAValidator.validate(address, networkProtocol);
      return isValid;
    } else {
      return this.customValidator(address, networkProtocol);
    }
  }

  private doesValidatorExist(networkProtocol: string | undefined): boolean {
    return !!networkProtocol && !!WAValidator.findCurrency(networkProtocol);
  }

  private customValidator(address: string, networkProtocol: string | undefined): boolean {
    switch (networkProtocol) {
      case 'HBAR':
        return this.validateHBAR(address);
      case 'NEAR':
        return this.validateNEAR(address);
      case 'TERRA':
        return this.validateTERRA(address);
      default:
        throw new Error('Unsupported networkProtocol or undefined ' + networkProtocol);
    }
  }

  private validateHBAR(address: string): boolean {
    const hbarAddressPattern = /^0.0.[1-9][0-9]{0,8}$/;
    return hbarAddressPattern.test(address);
  }

  private validateNEAR(address: string): boolean {
    const nearAddressRegex = /^near1[a-z0-9_-]{48,}$/;
    return nearAddressRegex.test(address);
  }

  private validateXDC(address: string, networkProtocol: string): boolean {
    const xdcPrefix = 'xdc';
    const ethereumStyleAddress = '0x' + address.slice(xdcPrefix.length);
    return WAValidator.validate(ethereumStyleAddress, networkProtocol);
  }

  private validateTERRA(address: string): boolean {
    const terraAddressRegex = /^terra1[a-z0-9]{38}$/;
    return terraAddressRegex.test(address);
  }
}
