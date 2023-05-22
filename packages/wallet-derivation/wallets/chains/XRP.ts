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
  protected readonly KEY_SEQUENCE = 's';
  protected readonly KEY_FEE = 'f';
  protected readonly KEY_LEDGER_SEQUENCE = 'l';

  protected readonly MIN_XRP_BALANCE = 10;
}
