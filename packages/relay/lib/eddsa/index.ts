import { stringToBytes } from "shared";
import {
  hexToNumber,
  numberToBytesLE,
  randomBytes,
  concatBytes,
  _0n,
} from "../bytes";
import {
  CURVE,
  sha512,
  mod,
  modlLE,
  scalarMult,
  serialize,
  decodePoint,
  edwards,
  fbksScalarMult,
  B,
} from "./ed25519";
import { decode } from "bs58check";
import { toBigIntBE, toBufferBE } from "bigint-buffer";
import { Hmac, createHmac } from "crypto";

/**
 * Generate a Fireblocks EdDSA signature for a given message and private key.
 *
 * @param message string or byte array to sign
 * @param privateKey hex-encoded private key
 * @returns Fireblocks EdDSA signature
 */
export const eddsaSign = async (
  message: string | Uint8Array,
  privateKey: string
) => {
  const privateKeyInt = hexToNumber(privateKey);
  const privateKeyBytes = numberToBytesLE(privateKeyInt);
  const messageBytes = stringToBytes(message);
  const seed = randomBytes();

  const nonceDigest = await sha512(seed, privateKeyBytes, messageBytes);
  const nonce = modlLE(nonceDigest);

  const R = scalarMult(nonce);
  const A = scalarMult(privateKeyInt);

  const serializedR = serialize(R);
  const serializedA = serialize(A);

  const hramDigest = await sha512(serializedR, serializedA, messageBytes);
  const hram = modlLE(hramDigest);

  const s = mod(hram * privateKeyInt + nonce, CURVE.l);
  const signature = concatBytes(serializedR, numberToBytesLE(s));

  return signature;
};

/**
 * Derive an address from an fPRV
 * @param fprv The fireblocks extended private key
 * @param derivationPath The derivation path to use
 */
export const eddsaDerive = (
  fprv: string,
  derivationPath: string | number[]
): [bigint | undefined, string] => {
  const hashForDerive = (
    pubKey: readonly [bigint, bigint],
    chainCode: Buffer,
    idx: number
  ) => {
    const ctx = createHmac("sha512", chainCode);
    ctx.update(serialize(pubKey));
    ctx.update(Buffer.from([0x0]));
    ctx.update(Buffer.from([idx]));
    return ctx.digest();
  };

  const derive_next_key_level = (
    pubKey: readonly [bigint, bigint],
    prvKey: bigint,
    chainCode: Buffer,
    idx: number
  ): [readonly [bigint, bigint], bigint, Buffer] => {
    const hash = hashForDerive(pubKey, chainCode, idx);
    const derivedChainCode = hash.subarray(33);
    const exp = toBigIntBE(hash.subarray(0, 32));
    const tmpPoint = fbksScalarMult(B, exp);
    const derivedPubKey = edwards(pubKey, tmpPoint);
    const derivedPrvKey = (prvKey + exp) % CURVE.l;
    return [derivedPubKey, derivedPrvKey, derivedChainCode];
  };

  const derivationValues: number[] =
    typeof derivationPath === typeof ""
      ? (derivationPath as string)
          .replace("m/", "")
          .split("/")
          .map((v: string) => parseInt(v))
      : (derivationPath as number[]);

  const decodedKey = decode(fprv);
  if (decodedKey.length !== 78) {
    throw new Error("FPRV Provided is not a valid FPRV or FPUB");
  }

  const prefix = decodedKey.readInt32BE();
  const isPrivate =
    prefix === 0x03273a10
      ? true
      : prefix === 0x03273e4b
      ? false
      : new Error("FPRV Provided is not a valid FPRV or FPUB");

  if (typeof isPrivate === typeof new Error()) {
    throw isPrivate;
  }

  let chainCode = decodedKey.subarray(13, 45);
  let prvKey: bigint | undefined = toBigIntBE(decodedKey.subarray(46));
  let pubKey: readonly [bigint, bigint];
  if (isPrivate) {
    pubKey = scalarMult(prvKey); // Might be wrong generator point
  } else {
    pubKey = decodePoint(prvKey);
    prvKey = _0n;
  }

  for (let i = 0; i < derivationValues.length; i++) {
    const [tmpPubKey, tmpPrvKey, tmpChainCode] = derive_next_key_level(
      pubKey,
      prvKey,
      chainCode,
      derivationValues[i]
    );

    pubKey = tmpPubKey;
    prvKey = tmpPrvKey;
    chainCode = tmpChainCode;
  }

  if (!isPrivate) {
    prvKey = undefined;
  }

  return [prvKey, Buffer.from(serialize(pubKey)).toString("hex")];
};
