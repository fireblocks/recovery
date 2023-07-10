import { Buffer } from 'buffer';
import { toBigIntBE } from 'bigint-buffer';
import { decode } from 'bs58check';
import { createHmac, getRandomValues, randomBytes as cRandomBytes } from 'crypto';
import { toBeHex } from 'ethers';
import { ExtendedPoint, CURVE as edCURVE, etc } from '@noble/ed25519';
import { bytesToNumberLE, concatBytes, numberToBytesBE, numberToBytesLE, hexToNumber } from '@noble/curves/abstract/utils';
import { Input, KeyDerivation } from '../types';
import { BaseWallet } from './BaseWallet';

/**
 * Get a SHA-512 digest of concatenated byte array messages.
 *
 * @param messages list of byte arrays
 * @returns byte array of SHA-512 digest
 */
const sha512 = async (...messages: Uint8Array[]) => {
  const buffer = concatBytes(...messages);

  const digest = await crypto.subtle.digest('SHA-512', buffer);

  return new Uint8Array(digest);
};

/**
 * Get a byte array of cryptographically-secure random bytes.
 *
 * @param length length of byte array
 * @returns byte array
 */
const randomBytes = (length = 32) => {
  if (typeof getRandomValues !== 'function') {
    return cRandomBytes(length);
  }

  return getRandomValues(new Uint8Array(length));
};

// eslint-disable-next-line @typescript-eslint/naming-convention
const _0n = 0n;

/**
 * Convert a number to a 4-byte long byte array in big-endian order.
 *
 * @param number number
 * @returns 4-byte long byte array in big-endian order
 */
const numberTo4BytesBE = (number: number) => Buffer.from([number >> 24, number >> 16, number >> 8, number]);

const flatten = (p: ExtendedPoint): ExtendedPoint => ExtendedPoint.fromAffine(p.toAffine());

export abstract class EdDSAWallet extends BaseWallet {
  constructor(input: Input, defaultCoinType: number) {
    super(input, defaultCoinType, 'EDDSA');
  }

  private static hashForDerive(pubKey: ExtendedPoint, chainCode: Uint8Array, idx: number) {
    const hmac = createHmac('sha512', chainCode);
    hmac.update(Buffer.from(pubKey.toHex(), 'hex'));
    hmac.update(Buffer.from([0x0]));
    hmac.update(numberTo4BytesBE(idx));
    return hmac.digest();
  }

  private static deriveNextKeyLevel(
    pubKey: ExtendedPoint,
    prvKey: bigint,
    chainCode: Uint8Array,
    idx: number,
  ): [ExtendedPoint, bigint, Uint8Array] {
    const hash = EdDSAWallet.hashForDerive(pubKey, chainCode, idx);
    const derivedChainCode = hash.subarray(32);
    const exp = toBigIntBE(hash.subarray(undefined, 32));
    const tmpPoint = flatten(ExtendedPoint.BASE.mul(exp % edCURVE.n));
    const derivedPubKey = flatten(pubKey.add(tmpPoint));
    const derivedPrvKey = (prvKey + exp) % edCURVE.n;
    return [derivedPubKey, derivedPrvKey, derivedChainCode];
  }

  /**
   * Derive an address from an fprv
   * @param extendedKey The fprv/fpub to derive from
   * @param derivationPath The derivation path to use
   */
  protected derive(extendedKey: string): KeyDerivation {
    const decodedKey = decode(extendedKey);

    if (decodedKey.length !== 78) {
      throw new Error('Extended key is not a valid FPRV or FPUB');
    }

    const prefix = extendedKey.slice(0, 4);

    let isPrivate = false;

    if (prefix === 'fprv') {
      isPrivate = true;
    } else if (prefix !== 'fpub') {
      throw new Error('Extended key is not a valid fprv or fpub');
    }

    let chainCode = decodedKey.subarray(13, 45);
    let prvKey: bigint | undefined = toBigIntBE(Buffer.from(decodedKey.subarray(46))) ?? undefined;
    let pubKey: ExtendedPoint;

    if (isPrivate) {
      pubKey = ExtendedPoint.fromAffine(ExtendedPoint.BASE.mul(prvKey).toAffine());
    } else {
      pubKey = ExtendedPoint.fromHex(Buffer.from(numberToBytesBE(prvKey, 32)).toString('hex'));
      prvKey = _0n;
    }

    [pubKey, prvKey, chainCode] = this.pathParts.reduce(
      ([_pubKey, _prvKey, _chainCode], pathPart) => EdDSAWallet.deriveNextKeyLevel(_pubKey, _prvKey, _chainCode, pathPart),
      [pubKey, prvKey, chainCode],
    );

    if (!isPrivate) {
      prvKey = undefined;
    }

    const publicKey = `0x${pubKey.toHex()}`;
    const privateKey = prvKey ? toBeHex(prvKey) : undefined;

    return { publicKey, privateKey };
  }

  /**
   * Generate a Fireblocks EdDSA signature for a given message and private key.
   *
   * @param message string or byte array to sign
   * @param privateKey hex-encoded private key
   * @returns Fireblocks EdDSA signature
   */
  protected async sign(message: string | Uint8Array, hasher: (...msgs: Uint8Array[]) => Promise<Uint8Array> = sha512) {
    if (!this.privateKey) {
      throw new Error('Cannot sign without a derived private key');
    }

    const privateKeyInt = hexToNumber(this.privateKey.slice(2));
    const privateKeyBytes = numberToBytesLE(privateKeyInt, 32);
    const messagesBytes = typeof message === 'string' ? Buffer.from(message) : message;
    const messageBytes = concatBytes(messagesBytes);

    const seed = randomBytes();

    const nonceDigest = await hasher(seed, privateKeyBytes, messageBytes);
    const nonce = etc.mod(bytesToNumberLE(nonceDigest), edCURVE.n);

    const R = ExtendedPoint.BASE.mul(nonce);
    const A = ExtendedPoint.BASE.mul(privateKeyInt);

    const serializedR = R.toRawBytes();
    const serializedA = A.toRawBytes();

    const hramDigest = await hasher(serializedR, serializedA, messageBytes);
    const hram = etc.mod(bytesToNumberLE(hramDigest), edCURVE.n);

    const s = etc.mod(hram * privateKeyInt + nonce, edCURVE.n);
    const signature = concatBytes(serializedR, numberToBytesLE(s, 32));

    return signature;
  }
}
