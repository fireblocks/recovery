import { BaseWallet, Input } from '@fireblocks/wallet-derivation';
import { EVM } from '.';

export class RootstockBTC extends EVM implements BaseWallet {
  constructor(input: Input) {
    super(input, input.isTestnet ? 'https://public-node.testnet.rsk.co' : 'https://public-node.rsk.co');
  }
}
