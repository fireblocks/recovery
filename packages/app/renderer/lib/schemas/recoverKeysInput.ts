import { z } from "zod";
import { nonEmptyString } from "./scalars";

export const recoverKeysInput = z.object({
  zip: nonEmptyString().describe(
    "Base64-encoded string representation of backup ZIP file"
  ),
  passphrase: nonEmptyString().describe("Recovery passphrase"),
  rsaKey: nonEmptyString().describe("RSA private key"),
  rsaKeyPassphrase: z.string().trim().describe("RSA private key passphrase"),
});
