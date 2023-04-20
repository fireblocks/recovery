import bs58check from 'bs58check';
import { Input } from '../../types';
import { BTCWalletBase } from './BTCBase';

export class DogeCoin extends BTCWalletBase {
  constructor(input: Input) {
    super(input, 3);
  }

  protected getAddress(): string {
    const midwayHash = `1e${this.getRipeShaHash().slice(2)}`;

    return bs58check.encode(Buffer.from(midwayHash, 'hex'));
  }
}
