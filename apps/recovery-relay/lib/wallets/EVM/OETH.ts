import { BaseWallet, Input } from '@fireblocks/wallet-derivation';
import { EVM } from '.';

export class Optimism extends EVM implements BaseWallet {
  constructor(input: Input) {
    super(input, input.isTestnet ? 'https://kovan.optimism.io' : 'https://mainnet.optimism.io');
  }
}
