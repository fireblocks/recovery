import { BaseWallet, Input } from '@fireblocks/wallet-derivation';
import { EVM } from '.';

export class XinFin extends EVM implements BaseWallet {
  constructor(input: Input) {
    if (input.isTestnet) {
      throw new Error('No XDC testnet support.');
    }
    super(input, 'https://rpc.xinfin.network');
  }

  protected getAddress(): string {
    const address = super.getAddress();
    return address.replace('0x', 'xdc');
  }
}
