// Reference: https://github.com/paulmillr/noble-ed25519
// MIT License (c) 2019 Paul Miller (paulmillr.com)

// Be friendly to bad ECMAScript parsers by not using bigint literals like 123n
const _0n = BigInt(0);
const _1n = BigInt(1);
const _2n = BigInt(2);
const _8n = BigInt(8);
const _255n = BigInt(255);
const _0xffn = BigInt(0xff);

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

// const d = -_1n * _121666n * invert(_121666n);

/**
 * Precomputed hex values for bytes 0-255.
 */
const hexes = Array.from({ length: 256 }, (v, i) =>
  i.toString(16).padStart(2, "0")
);

/**
 * Assert that a value is a Uint8Array.
 *
 * @param value
 * @returns void
 */
function assertUint8Array(value: any): asserts value is Uint8Array {
  if (!(value instanceof Uint8Array)) {
    throw new Error("Uint8Array expected");
  }
}

/**
 * Convert a hex string to a bigint.
 *
 * @param hex hex string with optional 0x prefix
 * @returns bigint
 */
export const hexToNumber = (hex: string) =>
  BigInt(hex.startsWith("0x") ? hex : `0x${hex}`);

/**
 * Convert a byte array in little-endian order to a bigint.
 *
 * @param array byte array in little-endian order
 * @returns bigint
 */
const bytesToNumberLE = (array: Uint8Array) => {
  assertUint8Array(array);

  const littleEndianArray = Uint8Array.from(array).reverse();

  const hex = littleEndianArray.reduce((acc, byte) => acc + hexes[byte], "");

  return hexToNumber(hex);
};

/**
 * Convert a bigint to a 32-byte long byte array in little-endian order.
 *
 * @param number bigint
 * @returns 32-byte long byte array in little-endian order
 */
export const numberToBytesLE = (number: bigint) => {
  const array = new Uint8Array(32);

  let bigint = BigInt(number);

  for (let i = 0; i < array.length; i++) {
    array[i] = Number(bigint & _0xffn);
    bigint >>= _8n;
  }

  return array;
};

/**
 * Convert a string to a byte array.
 *
 * @param message string or byte array
 * @returns byte array
 */
export const messageToBytes = (message: string | Uint8Array) => {
  if (typeof message === "string") {
    return Uint8Array.from(
      Array.from(message).map((letter) => letter.charCodeAt(0))
    );
  }

  assertUint8Array(message);

  return message;
};

/**
 * Get a byte array of cryptographically-secure random bytes.
 *
 * @param length length of byte array
 * @returns byte array
 */
export const randomBytes = (length = 32) =>
  window.crypto.getRandomValues(new Uint8Array(length));

/**
 * Concatenate a list of byte arrays.
 *
 * @param arrays list of byte arrays
 * @returns concatenated byte array
 */
export const concatBytes = (...arrays: Uint8Array[]) => {
  arrays.every(assertUint8Array);

  if (arrays.length === 1) {
    return arrays[0];
  }

  const length = arrays.reduce((acc, arr) => acc + arr.length, 0);

  const result = new Uint8Array(length);

  for (let i = 0, pad = 0; i < arrays.length; i += 1) {
    const arr = arrays[i];

    result.set(arr, pad);

    pad += arr.length;
  }

  return result;
};

/**
 * Get a SHA-512 digest of concatenated byte array messages.
 *
 * @param messages list of byte arrays
 * @returns byte array of SHA-512 digest
 */
export const sha512 = async (...messages: Uint8Array[]) => {
  const { buffer } = concatBytes(...messages);

  const digest = await window.crypto.subtle.digest("SHA-512", buffer);

  return new Uint8Array(digest);
};

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
