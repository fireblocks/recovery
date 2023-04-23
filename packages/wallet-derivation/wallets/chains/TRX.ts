import { modPow } from 'bigint-mod-arith';
import { secp256k1 } from '@noble/curves/secp256k1';
import { keccak256 } from 'ethers';
import bs58check from 'bs58check';
import { Input } from '../../types';
import { ECDSAWallet } from '../ECDSAWallet';

export class Tron extends ECDSAWallet {
  // Tron needs decompressed for address calculation
  private decompressedPubKey: string | undefined;

  constructor(input: Input) {
    super(input, 195);
  }

  protected getAddress(): string {
    const compPubKey = BigInt('0x' + this.publicKey.replace('0x', '').slice(2));
    const fieldP = secp256k1.CURVE.Fp.ORDER;
    const ySquared = (modPow(compPubKey, 3, fieldP) + BigInt(7)) % fieldP;
    let y = modPow(ySquared, (fieldP + BigInt(1)) / BigInt(4), fieldP);

    if (y % BigInt(2) !== BigInt(this.publicKey.slice(0, 4)) % BigInt(2)) {
      y = fieldP - y;
    }

    this.decompressedPubKey = `04${this.publicKey.replace('0x', '').slice(2)}${y.toString(16).replace('0x', '')}`;

    const hash = `41${keccak256(Buffer.from(this.decompressedPubKey!.slice(2), 'hex')).slice(-40)}`;
    return bs58check.encode(Buffer.from(hash, 'hex'));
  }

  protected readonly KEY_TX = 't';
}
