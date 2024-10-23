import { Input } from '@fireblocks/wallet-derivation';
import { ConnectedWallet } from '../ConnectedWallet';
import { EVM } from '.';

export class Ethereum extends EVM implements ConnectedWallet {
  constructor(input: Input) {
    // eslint-disable-next-line no-nested-ternary
    super(input, input.isTestnet ? (input.assetId === 'ETH_TEST3' ? 6 : input.assetId === 'ETH_TEST5' ? 11155111 : 17000) : 1);
  }
}
