import { Buffer } from 'buffer';
import { sha256 } from '@noble/hashes/sha256';
import { ripemd160 } from '@noble/hashes/ripemd160';
import { ECDSAWallet } from '../ECDSAWallet';

export abstract class BTCWalletBase extends ECDSAWallet {
  protected getRipeShaHash(): string {
    const publicKeyBuffer = Buffer.from(this.publicKey.slice(2), 'hex');

    const midwayDoubleHash = Buffer.from(ripemd160(sha256(publicKeyBuffer)))
      .toString('hex')
      .replace('0x', '');

    if (midwayDoubleHash.length < 42) {
      return '0'.repeat(42 - midwayDoubleHash.length) + midwayDoubleHash;
    }
    return midwayDoubleHash;
  }
}
