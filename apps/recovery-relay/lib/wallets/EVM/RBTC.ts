import { Input } from '@fireblocks/wallet-derivation';
import { ConnectedWallet } from '../ConnectedWallet';
import { EVM } from '.';

export class RootstockBTC extends EVM implements ConnectedWallet {
  constructor(input: Input) {
    super(input, input.isTestnet ? 31 : 30);
  }
}
