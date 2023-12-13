import * as WAValidator from 'multicoin-address-validator';
import { bech32 } from 'bech32';
import { getLogger } from './getLogger';
import { LOGGER_NAME_SHARED } from '../constants';

const logger = getLogger(LOGGER_NAME_SHARED);

export class AddressValidator {
  // specialAssets - lists chains with an untrivial networkProtocol/address which breaks validation.
  static readonly specialAssets: string[] = ['XDC', 'BCH', 'BSV', 'DOGE', 'LTC', 'DASH'];

  public isValidAddress(address: string, networkProtocol: string | undefined, assetId: string): boolean {
    try {
      let isValid: boolean = false;
      if (AddressValidator.specialAssets.includes(assetId)) {
        isValid = this.customValidator(address, 'validateByAsset', assetId);
      } else if (this.doesValidatorExist(networkProtocol)) {
        isValid = WAValidator.validate(address, networkProtocol);
      } else {
        isValid = this.customValidator(address, networkProtocol, assetId);
      }
      logger.info(`Received ${String(isValid)} validation result for ${networkProtocol} protocol address`);
      return isValid;
    } catch (error: any) {
      logger.error(error);
      throw new Error(`Error validating address with network protocol ${networkProtocol}: ${error.message}`);
    }
  }

  private doesValidatorExist(networkProtocol: string | undefined): boolean {
    return !!networkProtocol && !!WAValidator.findCurrency(networkProtocol);
  }

  private customValidator(address: string, validatorReference: string | undefined, assetId: string): boolean {
    // XDC special treatment
    if (validatorReference === 'validateByAsset' && assetId === 'XDC') {
      validatorReference = 'XDC';
    }

    switch (validatorReference) {
      case 'validateByAsset':
        return this.validateByAsset(address, assetId);
      case 'XDC':
        return this.validateXDC(address);
      case 'HBAR':
        return this.validateHBAR(address);
      case 'NEAR':
        return this.validateNEAR(address);
      case 'COSMOS':
        return this.validateCOSMOS(address);
      case 'TERRA':
        return this.validateTERRA(address);
      default:
        logger.error('Unsupported networkProtocol for address validation ' + validatorReference);
        throw new Error('Unsupported networkProtocol for address validation ' + validatorReference);
    }
  }

  private validateByAsset(address: string, assetId: string): boolean {
    return WAValidator.validate(address, assetId);
  }

  private validateXDC(address: string): boolean {
    const xdcPrefix = 'xdc';
    const ethereumStyleAddress = '0x' + address.slice(xdcPrefix.length);
    return WAValidator.validate(ethereumStyleAddress, 'ETH');
  }

  private validateHBAR(address: string): boolean {
    const hbarAddressPattern = /^0.0.[1-9][0-9]{0,8}$/;
    return hbarAddressPattern.test(address);
  }

  private validateNEAR(address: string): boolean {
    const accountIdRegex = /^[a-zA-Z0-9\-\_]+\.near$/;
    const implicitAddressRegex = /^[a-f0-9]{64}$/;
    return accountIdRegex.test(address) || implicitAddressRegex.test(address);
  }

  private validateCOSMOS(address: string): boolean {
    const decoded = bech32.decode(address);
    if (decoded.prefix !== 'cosmos') {
      return false;
    }
    const encoded = bech32.encode(decoded.prefix, decoded.words);
    if (encoded !== address.toLowerCase()) {
      return false;
    }
    return true;
  }

  private validateTERRA(address: string): boolean {
    const decoded = bech32.decode(address);
    if (decoded.prefix !== 'terra') {
      return false;
    }
    const encoded = bech32.encode(decoded.prefix, decoded.words);
    if (encoded !== address.toLowerCase()) {
      return false;
    }
    return true;
  }
}
