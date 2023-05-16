import { Input } from '@fireblocks/wallet-derivation';
import { ConnectedWallet } from '../ConnectedWallet';
import { EVM } from '.';

export class Matic extends EVM implements ConnectedWallet {
  constructor(input: Input) {
    super(
      input,
      `${input.isTestnet ? 'https://polygon-mumbai.infura.io/v3/4458cf4d1689497b9a38b1d6bbf05e78' : 'https://polygon-rpc.com/'}`,
    );
  }
}
