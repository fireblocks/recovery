import bs58check from 'bs58check';
import { Input } from '../../types';
import { BTCWalletBase } from './BTCBase';

export class BitcoinSV extends BTCWalletBase {
  constructor(input: Input) {
    super(input, 236);
  }

  protected getAddress(): string {
    const midwayHash = this.getRipeShaHash();
    return bs58check.encode(Buffer.from(midwayHash, 'hex'));
  }
}
