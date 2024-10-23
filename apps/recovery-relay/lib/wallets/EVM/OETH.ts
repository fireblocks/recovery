import { Input } from '@fireblocks/wallet-derivation';
import { ConnectedWallet } from '../ConnectedWallet';
import { EVM } from '.';

export class Optimism extends EVM implements ConnectedWallet {
  constructor(input: Input) {
    super(input, input.isTestnet ? 69 : 10);
  }
}
