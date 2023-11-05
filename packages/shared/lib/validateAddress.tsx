import * as WAValidator from 'multicoin-address-validator';
export class AddressValidator {
  public isValidAddress(address: string, networkProtocol: string | undefined): boolean {
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
      default:
        throw new Error('Unsupported networkProtocol or undefined' + networkProtocol);
    }
  }

  private validateHBAR(address: string): boolean {
    const hbarAddressPattern = /^0.0.[1-9][0-9]{0,8}$/;
    return hbarAddressPattern.test(address);
  }
}
