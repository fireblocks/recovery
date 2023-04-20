import bs58check from 'bs58check';
import { Input } from '../../types';
import { BTCWalletBase } from './BTCBase';

export class DASH extends BTCWalletBase {
  constructor(input: Input) {
    super(input, 5);
  }

  protected getAddress(): string {
    const midwayHash = `4c${this.getRipeShaHash().slice(2)}`;

    return bs58check.encode(Buffer.from(midwayHash, 'hex'));
  }
}
