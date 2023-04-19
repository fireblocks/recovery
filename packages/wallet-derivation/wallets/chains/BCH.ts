import { Address, Networks, PublicKey } from 'bitcore-lib-cash';
import { Input } from '../../types';
import { BTCWalletBase } from './BTCBase';

export class BitcoinCash extends BTCWalletBase {
  constructor(input: Input) {
    super(input, 145);
  }

  protected getAddress(): string {
    const addr = Address.fromPublicKey(new PublicKey(this.publicKey), this.isTestnet ? Networks.testnet : Networks.mainnet);
    return this.isLegacy ? addr.toLegacyAddress() : addr.toCashAddress();
  }
}
