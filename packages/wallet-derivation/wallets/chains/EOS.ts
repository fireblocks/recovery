import { ripemd160 } from '@noble/hashes/ripemd160';
import bs58 from 'bs58';
import { ECDSAWallet } from '../ECDSAWallet';
import { Input } from '../../types';

export class EOS extends ECDSAWallet {
  constructor(input: Input) {
    super(input, 194);
  }

  protected getAddress(): string {
    const keyBuffer = Buffer.from(this.publicKey.replace('0x', ''), 'hex');
    const checksum = ripemd160(keyBuffer).subarray(0, 4);
    const wholeKey = Buffer.concat([keyBuffer, checksum]);
    return `EOS${bs58.encode(wholeKey)}`;
  }

  public readonly KEY_TX = 't';

  public readonly KEY_CHAIN_ID = 'c';
}
