import { concatBytes } from "./bytes";

/**
 * Get a SHA digest of concatenated byte array messages.
 *
 * @param algorithm algorithm identifier
 * @param messages list of byte arrays
 * @returns byte array of SHA-512 digest
 */
export const sha = async (
  algorithm: AlgorithmIdentifier,
  ...messages: Uint8Array[]
) => {
  const { buffer } = concatBytes(...messages);

  const digest = await window.crypto.subtle.digest(algorithm, buffer);

  return new Uint8Array(digest);
};
