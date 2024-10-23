import { Input } from '@fireblocks/wallet-derivation';
import { ConnectedWallet } from '../ConnectedWallet';
import { EVM } from '.';

export class Avalanche extends EVM implements ConnectedWallet {
  constructor(input: Input) {
    super(input, input.isTestnet ? 43113 : 43114);
  }
}
