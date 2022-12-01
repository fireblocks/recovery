import { z } from "zod";
import { nonEmptyString } from "./nonEmptyString";

export const deriveKeysInput = z.object({
  asset: nonEmptyString().describe("Asset ID"),
  account: z.number().int().nonnegative().describe("Vault account ID"),
  change: z.number().int().nonnegative().describe("BIP44 change address index"),
  indexStart: z.number().int().nonnegative().describe("BIP44 index start"),
  indexEnd: z.number().int().nonnegative().describe("BIP44 index end"),
  useXpub: z
    .boolean()
    .optional()
    .describe("Derive public key instead of private key"),
  legacy: z.boolean().optional().describe("Use legacy format"),
  checksum: z.boolean().optional().describe("Use checksum"),
  testnet: z.boolean().optional().describe("Use testnet chain"),
});
