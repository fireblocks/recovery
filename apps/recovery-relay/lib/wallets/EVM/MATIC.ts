import { BaseWallet, Input } from '@fireblocks/wallet-derivation';
import { EVM } from '.';

export class Matic extends EVM implements BaseWallet {
  constructor(input: Input) {
    super(
      input,
      `${input.isTestnet ? 'https://polygon-mumbai.infura.io/v3/4458cf4d1689497b9a38b1d6bbf05e78' : 'https://polygon-rpc.com/'}`,
    );
  }
}
