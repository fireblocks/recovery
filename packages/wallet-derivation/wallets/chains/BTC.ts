import { p2pkh, p2wpkh } from 'bitcoinjs-lib/src/payments';
import { testnet, bitcoin as mainnet, Network } from 'bitcoinjs-lib/src/networks';
import { Input } from '../../types';
import { BTCWalletBase } from './BTCBase';

export class Bitcoin extends BTCWalletBase {
  private network: Network;

  constructor(input: Input) {
    super(input, 0);
    this.network = input.isTestnet ? testnet : mainnet;
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
