import { Input } from '@fireblocks/wallet-derivation';
import { ConnectedWallet } from '../ConnectedWallet';
import { EVM } from '.';

export class Fantom extends EVM implements ConnectedWallet {
  constructor(input: Input) {
    if (input.isTestnet) {
      throw new Error('No Fantom testnet support');
    }
    super(input, 250);
  }
}
