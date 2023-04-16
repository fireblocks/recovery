import { Input } from '@fireblocks/wallet-derivation';
import { BaseWallet } from '../BaseWallet';
import { EVM } from '.';

export class EthereumPoW extends EVM implements BaseWallet {
  constructor(input: Input) {
    if (input.isTestnet) {
      throw new Error('No EthereumPOW Testnet support.');
    }
    super(input, `https://mainnet.ethereumpow.org`);
  }
}
