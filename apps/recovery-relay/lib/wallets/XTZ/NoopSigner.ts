import { Signer } from '@taquito/taquito';
import { b58cencode, prefix } from '@taquito/utils';
import { encode } from 'bs58';

export class NoopSigner implements Signer {
  constructor(private pubKey: string, private address: string) {}

  sign(
    op: string,
    magicByte?: Uint8Array | undefined,
  ): Promise<{ bytes: string; sig: string; prefixSig: string; sbytes: string }> {
    throw new Error('Method not implemented.');
  }
  async publicKey(): Promise<string> {
    return b58cencode(this.pubKey.replace('0x', ''), prefix.edpk);
  }
  async publicKeyHash(): Promise<string> {
    return this.address;
  }
  secretKey(): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }
}
