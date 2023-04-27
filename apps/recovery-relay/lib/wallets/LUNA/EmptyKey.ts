/* eslint-disable @typescript-eslint/no-unused-vars */
import { Key, PublicKey, SignDoc, SignOptions, SignatureV2, Tx } from '@terra-money/terra.js';

export class EmptyKey implements Key {
  publicKey?: PublicKey | undefined;

  constructor(pubKey: PublicKey) {
    this.publicKey = pubKey;
  }

  sign(payload: Buffer): Promise<Buffer> {
    throw new Error('Not implemented');
  }

  get accAddress(): string {
    throw new Error('Not implemented.');
  }

  get valAddress(): string {
    throw new Error('Not implemented.');
  }

  createSignatureAmino(tx: SignDoc, isClassic?: boolean | undefined): Promise<SignatureV2> {
    throw new Error('Not implemented.');
  }

  createSignature(signDoc: SignDoc, isClassic?: boolean | undefined): Promise<SignatureV2> {
    throw new Error('Not implemented.');
  }

  signTx(tx: Tx, options: SignOptions, isClassic?: boolean | undefined): Promise<Tx> {
    throw new Error('Not implemented.');
  }
}
