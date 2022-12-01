import { z } from "zod";

export const recoverKeysInput = z.object({
  zip: z
    .string()
    .trim()
    .min(1)
    .describe("Base64-encoded string representation of backup ZIP file"),
  passphrase: z.string().trim().min(1).describe("Recovery passphrase"),
  rsaKey: z.string().trim().min(1).describe("RSA private key"),
  rsaKeyPassphrase: z
    .string()
    .trim()
    .optional()
    .describe("RSA private key passphrase"),
});
