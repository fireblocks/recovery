import { z } from "zod";
import { nonEmptyString } from "./scalars";

export const recoverKeysInput = z.object({
  backupCsv: z
    .custom<File>((value) => value instanceof File)
    .nullable()
    .describe("Address backup CSV file"),
  backupZip: nonEmptyString("Backup Kit is required").describe(
    "Base64-encoded string representation of backup ZIP file"
  ),
  passphrase: nonEmptyString("Passphrase is required").describe(
    "Recovery passphrase"
  ),
  rsaKey: nonEmptyString("Recovery private key is required").describe(
    "Recovery private key"
  ),
  rsaKeyPassphrase: z
    .string()
    .trim()
    .describe("Recovery private key passphrase"),
});
