import { BaseWallet, Input } from '@fireblocks/wallet-derivation';
import { EVM } from '.';

export class Aurora extends EVM implements BaseWallet {
  constructor(input: Input) {
    if (input.isTestnet) {
      throw new Error('No Aurora testnet support');
    }
    super(input, 'https://mainnet.aurora.dev');
  }
}
