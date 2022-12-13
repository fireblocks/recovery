// Reference: https://github.com/paulmillr/noble-ed25519
// MIT License (c) 2019 Paul Miller (paulmillr.com)

import {
  _0n,
  _1n,
  _2n,
  _8n,
  _255n,
  numberToBytesLE,
  bytesToNumberLE,
} from "../bytes";
import { sha } from "../sha";

/**
 * ed25519 is Twisted Edwards curve with equation of
 * ```
 * −x² + y² = 1 − (121665/121666) * x² * y²
 * ```
 */
export const CURVE = Object.freeze({
  // Equal to -121665/121666 over finite field.
  // Negative number is P - number, and division is invert(number, P)
  d: BigInt(
    "37095705934669439343138083508754565189542113879843219016388785533085940283555"
  ),
  // Finite field 𝔽p over which we'll do calculations; 2n ** 255n - 19n
  P: BigInt(
    "57896044618658097711785492504343953926634992332820282019728792003956564819949"
  ),
  // Subgroup order: how many points ed25519 has
  // in rfc8032 it's called l; 2n ** 252n + 27742317777372353535851937790883648493n
  l: BigInt(
    "7237005577332262213973186563042994240857116359379907606001950938285454250989"
  ),
  // Base point (x, y) aka generator point
  Gx: BigInt(
    "15112221349535400772501151409588531511454012693041857206046113283949847762202"
  ),
  Gy: BigInt(
    "46316835694926478169428394003475163141307993866256225615783033603165251855960"
  ),
});

/**
 * Get a SHA-512 digest of concatenated byte array messages.
 *
 * @param messages list of byte arrays
 * @returns byte array of SHA-512 digest
 */
export const sha512 = async (...messages: Uint8Array[]) =>
  sha("SHA-512", ...messages);

/**
 * Modulo operation.
 *
 * @param a bigint
 * @param b bigint, defaults to CURVE.P
 * @returns bigint
 */
export const mod = (a: bigint, b = CURVE.P) => {
  const res = a % b;

  return res >= _0n ? res : b + res;
};

/**
 * Convert a byte array to a bigint in little-endian order and modulo CURVE.l.
 *
 * @param digest byte array
 * @returns bigint
 */
export const modlLE = (digest: Uint8Array) =>
  mod(bytesToNumberLE(digest), CURVE.l);

/**
 * Invert number over modulo.
 *
 * @param number bigint
 * @param modulo modulus, defaults to CURVE.P
 * @returns
 */
const invert = (number: bigint, modulo = CURVE.P) => {
  if (number === _0n || modulo <= _0n) {
    throw new Error(
      `invert: expected positive integers, got n=${number} mod=${modulo}`
    );
  }

  let a = mod(number, modulo);
  let b = modulo;
  let x = _0n;
  let y = _1n;
  let u = _1n;
  let v = _0n;

  while (a !== _0n) {
    const q = b / a;
    const r = b % a;
    const m = x - u * q;
    const n = y - v * q;
    (b = a), (a = r), (x = u), (y = v), (u = m), (v = n);
  }

  if (b !== _1n) {
    throw new Error("invert: does not exist");
  }

  return mod(x, modulo);
};

/**
 * Edwards curve addition.
 *
 * @param P x, y coordinates of point P
 * @param Q x, y coordinates of point Q
 * @returns array of two bigints
 */
const edwards = (
  P: readonly [bigint, bigint],
  Q: readonly [bigint, bigint]
): readonly [bigint, bigint] => {
  const [x1, y1] = P;
  const [x2, y2] = Q;

  const t = mod(CURVE.d * x1 * x2 * y1 * y2);

  const x3 = (x1 * y2 + x2 * y1) * invert(_1n + t);
  const y3 = (y1 * y2 + x1 * x2) * invert(_1n - t);

  return [mod(x3), mod(y3)];
};

/**
 * Scalar multiplication of integer by base/generator point (x, y).
 *
 * @param e bigint
 * @returns array of two bigints
 */
export const scalarMult = (e: bigint): readonly [bigint, bigint] => {
  if (e === _0n) {
    return [_0n, _1n];
  }

  let Q = scalarMult(e / _2n);

  Q = edwards(Q, Q);

  if (e & _1n) {
    return edwards(Q, [CURVE.Gx, CURVE.Gy]);
  }

  return Q;
};

/**
 * Serialize a point P to a byte array.
 *
 * @param p x, y coordinates of point P
 * @returns
 */
export const serialize = (P: readonly [bigint, bigint]) => {
  const [x, y] = P;

  const number = x & _1n ? y + _2n ** _255n : y;

  return numberToBytesLE(number);
};
