import bs58check from 'bs58check';
import { Input } from '../../types';
import { BTCWalletBase } from './BTCBase';

export class ZCash extends BTCWalletBase {
  constructor(input: Input) {
    super(input, 133);
  }

  protected getAddress(): string {
    const midwayHash = `1cb8${this.getRipeShaHash().slice(2)}`;

    return bs58check.encode(Buffer.from(midwayHash, 'hex'));
  }
}
