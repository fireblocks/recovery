import { Buffer } from "buffer";
import { toBigIntBE } from "bigint-buffer";
import { decode } from "bs58check";
import { createHmac } from "crypto";
import { hexlify, toBeHex } from "ethers";
import { Input, DerivationInput } from "../../types";
import { BaseWallet } from "../BaseWallet";
import {
  hexToNumber,
  numberToBytesLE,
  numberToBytesBE,
  numberTo4BytesBE,
  randomBytes,
  concatBytes,
  _0n,
} from "./bytes";
import {
  sha512,
  mod,
  modlLE,
  scalarMult,
  serialize,
  decodePoint,
  edwards,
  G,
  CURVE,
} from "./ed25519";

export abstract class EdDSAWallet extends BaseWallet {
  constructor(input: Input, coinType: number) {
    super(input, coinType, "EDDSA");
  }

  private static hashForDerive(
    pubKey: readonly [bigint, bigint],
    chainCode: Uint8Array,
    idx: number
  ) {
    const hmac = createHmac("sha512", chainCode);
    hmac.update(serialize(pubKey));
    hmac.update(Buffer.from([0x0]));
    hmac.update(numberTo4BytesBE(idx));
    return hmac.digest();
  }

  private static deriveNextKeyLevel(
    pubKey: readonly [bigint, bigint],
    prvKey: bigint,
    chainCode: Uint8Array,
    idx: number
  ): [readonly [bigint, bigint], bigint, Uint8Array] {
    const hash = EdDSAWallet.hashForDerive(pubKey, chainCode, idx);

    const derivedChainCode = hash.subarray(32);

    const exp = toBigIntBE(hash.subarray(undefined, 32));

    const tmpPoint = scalarMult(G, exp);

    const derivedPubKey = edwards(pubKey, tmpPoint);

    const derivedPrvKey = (prvKey + exp) % CURVE.l;

    return [derivedPubKey, derivedPrvKey, derivedChainCode];
  }

  /**
   * Derive an address from an fPRV
   * @param fprv The fireblocks extended private key
   * @param derivationPath The derivation path to use
   */
  derive({ extendedKey, pathParts }: DerivationInput) {
    const decodedKey = decode(extendedKey);

    if (decodedKey.length !== 78) {
      throw new Error("Extended key is not a valid FPRV or FPUB");
    }

    const prefix = extendedKey.slice(0, 4);

    const isPrivate =
      prefix === "fprv"
        ? true
        : prefix === "fpub"
        ? false
        : new Error("Extended key is not a valid FPRV or FPUB");

    if (isPrivate instanceof Error) {
      throw isPrivate;
    }

    let chainCode = decodedKey.subarray(13, 45);
    let prvKey: bigint | undefined =
      toBigIntBE(Buffer.from(decodedKey.subarray(46))) ?? undefined;
    let pubKey: readonly [bigint, bigint];

    if (isPrivate) {
      pubKey = scalarMult(G, prvKey);
    } else {
      pubKey = decodePoint(numberToBytesBE(prvKey));
      prvKey = _0n;
    }

    [pubKey, prvKey, chainCode] = pathParts.reduce(
      ([_pubKey, _prvKey, _chainCode], pathPart) =>
        EdDSAWallet.deriveNextKeyLevel(_pubKey, _prvKey, _chainCode, pathPart),
      [pubKey, prvKey, chainCode]
    );

    if (!isPrivate) {
      prvKey = undefined;
    }

    const publicKey = hexlify(serialize(pubKey));
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
  static async eddsaSign(message: string | Uint8Array, privateKey: string) {
    const privateKeyInt = hexToNumber(privateKey);
    const privateKeyBytes = numberToBytesLE(privateKeyInt);
    const messagesBytes =
      typeof message === "string" ? Buffer.from(message) : message;
    const messageBytes = concatBytes(messagesBytes);
    const seed = randomBytes();

    const nonceDigest = await sha512(seed, privateKeyBytes, messageBytes);
    const nonce = modlLE(nonceDigest);

    const R = scalarMult(G, nonce);
    const A = scalarMult(G, privateKeyInt);

    const serializedR = serialize(R);
    const serializedA = serialize(A);

    const hramDigest = await sha512(serializedR, serializedA, messageBytes);
    const hram = modlLE(hramDigest);

    const s = mod(hram * privateKeyInt + nonce, CURVE.l);
    const signature = concatBytes(serializedR, numberToBytesLE(s));

    return signature;
  }
}
