import { BaseWallet, Input } from '@fireblocks/wallet-derivation';
import { EVM } from '.';

export class BinanceSmartChain extends EVM implements BaseWallet {
  constructor(input: Input) {
    super(input, `${input.isTestnet ? 'https://data-seed-prebsc-1-s1.binance.org:8545/' : 'https://bsc-dataseed.binance.org/'}`);
  }
}
