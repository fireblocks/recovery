import { BaseWallet, Input } from '@fireblocks/wallet-derivation';
import { EVM } from '.';

export class Fantom extends EVM implements BaseWallet {
  constructor(input: Input) {
    if (input.isTestnet) {
      throw new Error('No fantom testnet support');
    }
    super(input, `${input.isTestnet ? '' : 'https://rpcapi.fantom.network'}`);
  }
}
