import { BaseWallet, Input } from '@fireblocks/wallet-derivation';
import { EVM } from '.';

export class Arbitrum extends EVM implements BaseWallet {
  constructor(input: Input) {
    super(input, `${input.isTestnet ? 'https://goerli-rollup.arbitrum.io/rpc' : 'https://arbitrum-goerli.public.blastapi.io'}`);
  }
}
