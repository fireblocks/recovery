import { p2pkh, p2wpkh } from 'bitcoinjs-lib/src/payments';
import { Input } from '../../types';
import { BTCWalletBase } from './BTCBase';

export class Bitcoin extends BTCWalletBase {
  constructor(input: Input) {
    super(input, 0);
  }

  protected getAddress(): string {
    const publicKeyBuffer = Buffer.from(this.publicKey.slice(2), 'hex');

    const method = this.isLegacy ? p2pkh : p2wpkh;

    let { address = '' } = method({ pubkey: publicKeyBuffer });

    if (this.isTestnet) {
      address = address.replace(/^bc/, 'tb');
    }

    return address;
  }
}
