import { BaseWallet, Input } from '@fireblocks/wallet-derivation';
import { EVM } from '.';

export class Celo extends EVM implements BaseWallet {
  constructor(input: Input) {
    if (input.isTestnet) {
      throw new Error('No CELO testnet support.');
    }
    super(input, 'https://forno.celo.org');
  }
}
