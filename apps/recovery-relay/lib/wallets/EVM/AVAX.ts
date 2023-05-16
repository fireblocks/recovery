import { Input } from '@fireblocks/wallet-derivation';
import { ConnectedWallet } from '../ConnectedWallet';
import { EVM } from '.';

export class Avalanche extends EVM implements ConnectedWallet {
  constructor(input: Input) {
    super(input, `${input.isTestnet ? 'https://api.avax-test.network/ext/bc/C/rpc' : 'https://api.avax.network/ext/bc/C/rpc'}`);
  }
}
