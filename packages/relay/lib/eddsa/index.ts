import { stringToBytes } from "shared";
import {
  CURVE,
  hexToNumber,
  numberToBytesLE,
  randomBytes,
  concatBytes,
  sha512,
  mod,
  modlLE,
  scalarMult,
  serialize,
} from "./ed25519";

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
