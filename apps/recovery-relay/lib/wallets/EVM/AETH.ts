import { Input } from '@fireblocks/wallet-derivation';
import { ConnectedWallet } from '../ConnectedWallet';
import { EVM } from '.';

export class Arbitrum extends EVM implements ConnectedWallet {
  constructor(input: Input) {
    super(input, input.isTestnet ? 421611 : 42161);
  }
}
