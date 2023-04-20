import bs58check from 'bs58check';
import { bech32 } from 'bech32';
import { Input } from '../../types';
import { BTCWalletBase } from './BTCBase';

export class LiteCoin extends BTCWalletBase {
  constructor(input: Input) {
    super(input, 2);
  }

  protected getAddress(): string {
    const midwayHash = `30${this.getRipeShaHash().slice(2)}`;

    if (this.isLegacy) {
      return bs58check.encode(Buffer.from(midwayHash, 'hex'));
    }

    return bech32.encode('ltc', bech32.toWords(Buffer.from(`00${midwayHash.slice(2)}`, 'hex')));
  }
}
