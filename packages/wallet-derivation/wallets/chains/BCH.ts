import bitcore from 'bitcore-lib-cash';
import { Input } from '../../types';
import { BTCWalletBase } from './BTCBase';

export class BitcoinCash extends BTCWalletBase {
  constructor(input: Input) {
    super(input, 145);
  }

  protected getAddress(): string {
    const publicKey = new bitcore.PublicKey(this.publicKey.replace(/^0x/, ''));

    const network = this.isTestnet ? bitcore.Networks.testnet : bitcore.Networks.mainnet;

    const address = new bitcore.Address(publicKey, network);

    return this.isLegacy ? address.toLegacyAddress() : address.toCashAddress();
  }
}
