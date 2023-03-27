import { Input } from '@fireblocks/wallet-derivation';
import { BaseWallet } from '../BaseWallet';
import { EVM } from '.';

export class Ethereum extends EVM implements BaseWallet {
  constructor(input: Input) {
    super(input, `https://${input.isTestnet ? 'goerli' : 'mainnet'}.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161`);
  }
}
