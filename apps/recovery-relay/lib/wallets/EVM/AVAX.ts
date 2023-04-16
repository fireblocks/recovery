import { BaseWallet, Input } from '@fireblocks/wallet-derivation';
import { EVM } from '.';

export class Avalanche extends EVM implements BaseWallet {
  constructor(input: Input) {
    super(input, `${input.isTestnet ? 'https://api.avax.network/ext/bc/C/rpc' : 'https://api.avax-test.network/ext/bc/C/rpc'}`);
  }
}
