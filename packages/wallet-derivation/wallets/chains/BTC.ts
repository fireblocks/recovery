import { Buffer } from 'buffer';
import { p2pkh } from 'bitcoinjs-lib/src/payments/p2pkh';
import { p2wpkh } from 'bitcoinjs-lib/src/payments/p2wpkh';
import { ECDSAWallet } from '../ECDSAWallet';
import { Input } from '../../types';

export class Bitcoin extends ECDSAWallet {
  constructor(input: Input) {
    super(input, 0);
  }

  protected getAddress() {
    const publicKeyBuffer = Buffer.from(this.publicKey.slice(2), 'hex');

    const method = this.isLegacy ? p2pkh : p2wpkh;

    let { address = '' } = method({ pubkey: publicKeyBuffer });

    if (this.isTestnet) {
      address = address.replace(/^bc/, 'tb');
    }

    return address;
  }
}
