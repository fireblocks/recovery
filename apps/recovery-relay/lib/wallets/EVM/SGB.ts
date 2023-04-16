import { BaseWallet, Input } from '@fireblocks/wallet-derivation';
import { EVM } from '.';

export class Songbird extends EVM implements BaseWallet {
  constructor(input: Input) {
    if (input.isTestnet) {
      throw new Error('No Songbird testnet support.');
    }
    super(input, 'https://sgb.ftso.com.au/ext/bc/C/rpc');
  }
}
