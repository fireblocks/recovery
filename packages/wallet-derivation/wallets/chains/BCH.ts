import bitcore from 'bitcore-lib-cash';
import { Input } from '../../types';
import { BTCWalletBase } from './BTCBase';

export class BitcoinCash extends BTCWalletBase {
  constructor(input: Input) {
    super(input, 145);
  }

  protected getAddress(): string {
    const addr = bitcore.Address.fromPublicKey(
      new bitcore.PublicKey(this.publicKey),
      this.isTestnet ? bitcore.Networks.testnet : bitcore.Networks.mainnet,
    );
    return this.isLegacy ? addr.toLegacyAddress() : addr.toCashAddress();
  }
}
