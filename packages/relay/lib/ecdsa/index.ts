import { fromHex, toHex } from "uint8array-tools";
import bs58 from "bs58";
import { sha } from "../sha";

/**
 * Get a SHA digest of concatenated byte array messages.
 *
 * @param messages list of byte arrays
 * @returns byte array of SHA-512 digest
 */
export const sha256 = async (...messages: Uint8Array[]) =>
  sha("SHA-256", ...messages);

export const ecdsaHexToWif = async (
  privateKeyHex: string,
  isTestnet = false
) => {
  // Adding 0x80 byte in front (must) and 0x01 byte in the end (as it corresponds to compressed public key).
  const versionByte = isTestnet ? "EF" : "80";
  const compressionByte = "01";
  const fullKey = `${versionByte}${privateKeyHex}${compressionByte}`;
  const fullKeyBytes = fromHex(fullKey);

  // Double SHA-256
  const firstDigest = await sha256(fullKeyBytes);
  const secondDigest = await sha256(firstDigest);

  // TODO: Last 8 bytes (checksum) are invalid
  const checksum = toHex(secondDigest).slice(0, 8);

  const wifHex = `${fullKey}${checksum}`;
  const wifBytes = fromHex(wifHex);

  // Convert to base58
  const wif = bs58.encode(wifBytes);

  return wif;
};
