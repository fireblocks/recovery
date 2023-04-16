import { Input } from '@fireblocks/wallet-derivation';
import { BaseWallet } from '../BaseWallet';
import { EVM } from '.';

export class EVMOS extends EVM implements BaseWallet {
  constructor(input: Input) {
    if (input.isTestnet) {
      throw new Error('No EVMOS testnet support');
    }
    super(input, input.isTestnet ? 'https://evmos-evm.publicnode.com' : '');
  }
}
