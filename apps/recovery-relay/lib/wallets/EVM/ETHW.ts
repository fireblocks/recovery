import { Input } from '@fireblocks/wallet-derivation';
import { ConnectedWallet } from '../ConnectedWallet';
import { EVM } from '.';

export class EthereumPoW extends EVM implements ConnectedWallet {
  constructor(input: Input) {
    if (input.isTestnet) {
      throw new Error('No EthereumPOW Testnet support.');
    }
    super(input, `https://mainnet.ethereumpow.org`);
  }
}
