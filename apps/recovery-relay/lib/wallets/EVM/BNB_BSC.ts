import { Input } from '@fireblocks/wallet-derivation';
import { ConnectedWallet } from '../ConnectedWallet';
import { EVM } from '.';

export class BinanceSmartChain extends EVM implements ConnectedWallet {
  constructor(input: Input) {
    super(input, `${input.isTestnet ? 'https://data-seed-prebsc-1-s1.binance.org:8545/' : 'https://bsc-dataseed.binance.org/'}`);
  }
}
