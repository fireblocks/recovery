import { p2pkh, p2wpkh } from 'bitcoinjs-lib/src/payments';
import { Input } from '../../types';
import { BTCWalletBase } from './BTCBase';
import { testnet, bitcoin as mainnet } from 'bitcoinjs-lib/src/networks';

export class Bitcoin extends BTCWalletBase {
  constructor(input: Input) {
    super(input, 0);
  }

  protected getAddress(): string {
    const publicKeyBuffer = Buffer.from(this.publicKey.slice(2), 'hex');

    const method = this.isLegacy ? p2pkh : p2wpkh;

    let { address = '' } = method({ pubkey: publicKeyBuffer, network: this.isTestnet ? testnet : mainnet });

    if (this.isTestnet) {
      address = address.replace(/^bc/, 'tb');
    }

    return address;
  }
}
