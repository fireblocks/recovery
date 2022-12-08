import { z } from "zod";

export const decryptInput = z.object({
  passphrase: z.string().trim().min(1).describe("Encryption passphrase"),
});
