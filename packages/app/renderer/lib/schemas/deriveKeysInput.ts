import { z } from "zod";
import { nonNegativeInt } from "./scalars";

export const deriveKeysInput = z
  .object({
    accountIdStart: nonNegativeInt().describe("Vault account ID start"),
    accountIdEnd: nonNegativeInt().describe("Vault account ID end"),
    indexStart: nonNegativeInt().describe("BIP44 address index start"),
    indexEnd: nonNegativeInt().describe("BIP44 address index end"),
    isLegacy: z.boolean().describe("Use legacy format"),
    isChecksum: z.boolean().describe("Use checksum format"),
  })
  .refine(
    (data) => data.accountIdStart <= data.accountIdEnd,
    "Account ID start must be less than or equal to Account ID end"
  )
  .refine(
    (data) => data.indexStart <= data.indexEnd,
    "Index start must be less than or equal to Index end"
  );
