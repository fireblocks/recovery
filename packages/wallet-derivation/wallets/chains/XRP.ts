import { encodeAccountID } from 'xrpl';
import { BTCWalletBase } from './BTCBase';
import { Input } from '../../types';

export class Ripple extends BTCWalletBase {
  constructor(input: Input) {
    super(input, 144);
  }

  protected getAddress(): string {
    const midway = this.getRipeShaHash();
    return encodeAccountID(Buffer.from(midway.slice(2), 'hex'));
  }

  protected readonly KEY_TX = 't';
}
