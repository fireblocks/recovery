import * as WAValidator from 'multicoin-address-validator';
import { bech32 } from 'bech32';
import { isTestnetAsset } from '@fireblocks/asset-config';
import { getLogger } from './getLogger';
import { LOGGER_NAME_SHARED } from '../constants';

const logger = getLogger(LOGGER_NAME_SHARED);

export class AddressValidator {
  // specialAssets - lists chains with an untrivial networkProtocol/address which breaks validation.
  static readonly specialAssets: string[] = [
    'XDC',
    'BCH',
    'BCH_TEST',
    'BSV',
    'BSV_TEST',
    'DOGE',
    'DOGE_TEST',
    'LTC',
    'LTC_TEST',
    'DASH',
    'DASH_TEST',
  ];

  static readonly btcLikeAssetProtocols: { [key: string]: string } = {
    ZEC: 'ZEC',
    LTC: 'LTC',
    DASH: 'DASH',
  };

  public isValidAddress(address: string, networkProtocol: string | undefined, assetId: string): boolean {
    try {
      this.patchValidator();
      let isValid = false;
      let validationOptions: WAValidator.ValidateOpts = {};
      let asset = assetId;
      let networkProto = networkProtocol;
      if (assetId in AddressValidator.btcLikeAssetProtocols) {
        networkProto = AddressValidator.btcLikeAssetProtocols[assetId];
      }
      if (isTestnetAsset(assetId)) {
        validationOptions = { networkType: 'testnet' };
        if (assetId.includes('_TEST') || assetId.includes('TEST')) {
          asset = assetId.replace('_TEST', '').replace('TEST', '');
        }
      }
      if (AddressValidator.specialAssets.includes(assetId)) {
        isValid = this.customValidator(address, 'validateByAsset', asset, validationOptions);
      } else if (this.doesValidatorExist(networkProto)) {
        isValid = WAValidator.validate(address, networkProto, validationOptions);
      } else {
        isValid = this.customValidator(address, networkProto, asset, validationOptions);
      }
      logger.info(`Received ${String(isValid)} validation result for ${networkProtocol} protocol address`);
      return isValid;
    } catch (error: any) {
      logger.error(error);
      throw new Error(`Error validating address with network protocol ${networkProtocol}: ${error.message}`);
    }
  }

  /**
   * Fixes the validator dependency to fix some validations.
   */
  private patchValidator() {
    // Fix cardano testnet prefix:
    const adaTestBech32 = WAValidator.findCurrency('ADA')?.bech32Hrp.testnet;
    adaTestBech32.pop();
    adaTestBech32.push('addr_test');

    const trxTestAddrTypes = WAValidator.findCurrency('TRX')?.addressTypes.testnet;
    trxTestAddrTypes.pop();
    trxTestAddrTypes.push(0x41);
  }

  private doesValidatorExist(networkProtocol: string | undefined): boolean {
    return !!networkProtocol && !!WAValidator.findCurrency(networkProtocol);
  }

  private customValidator(
    address: string,
    validatorReference: string | undefined,
    assetId: string,
    validationOptions?: WAValidator.ValidateOpts,
  ): boolean {
    // XDC special treatment
    if (validatorReference === 'validateByAsset' && assetId === 'XDC') {
      validatorReference = 'XDC';
    }

    switch (validatorReference) {
      case 'validateByAsset':
        return this.validateByAsset(address, assetId, validationOptions);
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
        logger.error(`Unsupported networkProtocol for address validation ${validatorReference}`);
        throw new Error(`Unsupported networkProtocol for address validation ${validatorReference}`);
    }
  }

  private validateByAsset(address: string, assetId: string, validationOptions?: WAValidator.ValidateOpts): boolean {
    console.log(arguments);
    return WAValidator.validate(address, assetId, validationOptions);
  }

  private validateXDC(address: string): boolean {
    const xdcPrefix = 'xdc';
    const ethereumStyleAddress = `0x${address.slice(xdcPrefix.length)}`;
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

  private validateCosmosBased(prefix: string): (address: string) => boolean {
    return (address: string): boolean => {
      const decoded = bech32.decode(address);
      if (decoded.prefix !== prefix) {
        return false;
      }
      const encoded = bech32.encode(decoded.prefix, decoded.words);
      if (encoded !== address.toLowerCase()) {
        return false;
      }
      return true;
    };
  }

  private validateCOSMOS(address: string): boolean {
    return [this.validateCosmosBased('cosmos'), this.validateCosmosBased('celestia')].map((fn) => fn(address)).includes(true);
  }

  private validateTERRA(address: string): boolean {
    return this.validateCosmosBased('terra')(address);
  }
}
