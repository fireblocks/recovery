import { Input } from '@fireblocks/wallet-derivation';
import { ConnectedWallet } from '../ConnectedWallet';
import { EVM } from '.';

export class XinFin extends EVM implements ConnectedWallet {
  constructor(input: Input) {
    if (input.isTestnet) {
      throw new Error('No XDC testnet support.');
    }
    super(input, 50);
  }

  protected getAddress(): string {
    const address = super.getAddress();
    return address.replace('0x', 'xdc');
  }
}
