/**
 * Convert a string to a byte array.
 *
 * @param string string or byte array
 * @returns byte array
 */
export const stringToBytes = (string: string | Uint8Array) => {
  if (typeof string === 'string') {
    return Uint8Array.from(Array.from(string).map((letter) => letter.charCodeAt(0)));
  }

  if (string instanceof Uint8Array) {
    return string;
  }

  throw new Error('stringToBytes: input must be a string or Uint8Array');
};

/**
 * Convert a byte array to a Unicode string.
 *
 * @param array byte array
 * @returns Unicode string
 */
export const bytesToString = (array: Uint8Array) =>
  Array.from(array)
    .map((byte) => String.fromCharCode(byte))
    .join('');
