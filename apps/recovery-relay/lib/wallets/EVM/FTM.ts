import { BaseWallet, Input } from '@fireblocks/wallet-derivation';
import { EVM } from '.';

export class Fantom extends EVM implements BaseWallet {
  constructor(input: Input) {
    if (input.isTestnet) {
      throw new Error('No Fantom testnet support');
    }
    super(input, 'https://rpcapi.fantom.network');
  }
}
