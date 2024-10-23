import { Input } from '@fireblocks/wallet-derivation';
import { ConnectedWallet } from '../ConnectedWallet';
import { EVM } from '.';

export class BinanceSmartChain extends EVM implements ConnectedWallet {
  constructor(input: Input) {
    super(input, input.isTestnet ? 97 : 56);
  }
}
