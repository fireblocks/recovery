import { BaseWallet, Input } from '@fireblocks/wallet-derivation';
import { EVM } from '.';

export class Moonriver extends EVM implements BaseWallet {
  constructor(input: Input) {
    if (input.isTestnet) {
      throw new Error('No Moonriver testnet support.');
    }
    super(input, 'https://rpc.api.moonriver.moonbeam.network');
  }
}
