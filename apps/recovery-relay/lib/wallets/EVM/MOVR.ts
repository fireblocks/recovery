import { Input } from '@fireblocks/wallet-derivation';
import { ConnectedWallet } from '../ConnectedWallet';
import { EVM } from '.';

export class Moonriver extends EVM implements ConnectedWallet {
  constructor(input: Input) {
    if (input.isTestnet) {
      throw new Error('No Moonriver testnet support.');
    }
    super(input, 1285);
  }
}
