import { utils } from "ethers";
import crypto, { webcrypto } from "crypto";

/**
 * Get a SHA digest of concatenated byte array messages.
 *
 * @param algorithm algorithm identifier
 * @param messages list of byte arrays
 * @returns byte array of SHA-512 digest
 */
export const sha = async (
  algorithm: webcrypto.AlgorithmIdentifier,
  ...messages: Uint8Array[]
) => {
  const { buffer } = utils.concat(messages);

  const digest = await crypto.subtle.digest(algorithm, buffer);

  return new Uint8Array(digest);
};
