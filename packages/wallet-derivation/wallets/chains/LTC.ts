import { bech32 } from 'bech32';
import { Input } from '../../types';
import { BTCWalletBase } from './BTCBase';
import bs58check from 'bs58check';
import { createHash } from 'crypto';

export class LiteCoin extends BTCWalletBase {
  constructor(input: Input) {
    super(input, 2);
  }

  protected getAddress(): string {
    const midwayHash = this.getRipeShaHash(false);
    console.log('This ok: ', midwayHash);
    const prefix = this.isTestnet ? 'tltc' : 'ltc';
    const bechAddress = bech32.encode(prefix, [0, ...bech32.toWords(Buffer.from(midwayHash, 'hex'))]);

    const versionByte = this.isTestnet ? '6f' : '30';
    const checksum = createHash('sha256').update(createHash('sha256').update(midwayHash).digest()).digest().subarray(0, 4);
    const LAddress = bs58check.encode(Buffer.from(`${versionByte}${midwayHash}${checksum}`, 'hex'));

    const address = this.isLegacy ? LAddress : bechAddress;
    return address;
  }
}
