import crypto from "crypto";

// Be friendly to bad ECMAScript parsers by not using bigint literals like 123n
export const _0n = BigInt(0);
export const _1n = BigInt(1);
export const _2n = BigInt(2);
export const _8n = BigInt(8);
export const _255n = BigInt(255);
export const _0xffn = BigInt(0xff);

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
export const bytesToNumberLE = (array: Uint8Array) => {
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
 * Convert a bigint to a 32-byte long byte array in big-endian order.
 *
 * @param number bigint
 * @returns 32-byte long byte array in big-endian order
 */
export const numberToBytesBE = (number: bigint) => {
  const array = new Uint8Array(32);

  let bigint = BigInt(number);

  for (let i = array.length - 1; i >= 0; i--) {
    array[i] = Number(bigint & _0xffn);
    bigint >>= _8n;
  }

  return array;
};

/**
 * Convert a number to a 4-byte long byte array in big-endian order.
 *
 * @param number number
 * @returns 4-byte long byte array in big-endian order
 */
export const numberTo4BytesBE = (number: number) =>
  Buffer.from([number >> 24, number >> 16, number >> 8, number]);

/**
 * Get a byte array of cryptographically-secure random bytes.
 *
 * @param length length of byte array
 * @returns byte array
 */
export const randomBytes = (length = 32) =>
  crypto.getRandomValues(new Uint8Array(length));

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
