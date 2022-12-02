import { z } from "zod";
import { nonEmptyString, nonNegativeInt, optionalBoolean } from "./scalars";

export const deriveKeysInput = z.object({
  asset: nonEmptyString().describe("Asset ID"),
  account: nonNegativeInt().describe("Vault account ID"),
  change: nonNegativeInt().describe("BIP44 change address index"),
  indexStart: nonNegativeInt().describe("BIP44 index start"),
  indexEnd: nonNegativeInt().describe("BIP44 index end"),
  useXpub: optionalBoolean().describe(
    "Derive public key instead of private key"
  ),
  legacy: optionalBoolean().describe("Use legacy format"),
  checksum: optionalBoolean().describe("Use checksum"),
  testnet: optionalBoolean().describe("Use testnet chain"),
});
