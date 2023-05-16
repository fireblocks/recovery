import { Input } from '@fireblocks/wallet-derivation';
import { ConnectedWallet } from '../ConnectedWallet';
import { EVM } from '.';

export class Arbitrum extends EVM implements ConnectedWallet {
  constructor(input: Input) {
    super(input, `${input.isTestnet ? 'https://goerli-rollup.arbitrum.io/rpc' : 'https://arbitrum-goerli.public.blastapi.io'}`);
  }
}
