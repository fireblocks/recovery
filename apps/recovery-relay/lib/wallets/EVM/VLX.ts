import { BaseWallet, Input } from '@fireblocks/wallet-derivation';
import { EVM } from '.';

export class Velas extends EVM implements BaseWallet {
  constructor(input: Input) {
    super(input, input.isTestnet ? 'https://api.testnet.velas.com' : 'https://api.velas.com');
  }
}
