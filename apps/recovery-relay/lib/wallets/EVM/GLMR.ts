import { BaseWallet, Input } from '@fireblocks/wallet-derivation';
import { EVM } from '.';

export class Moonbeam extends EVM implements BaseWallet {
  constructor(input: Input) {
    if (input.isTestnet) {
      throw new Error('No Moonbeam testnet support');
    }
    super(input, 'https://rpc.api.moonbeam.network');
  }
}
