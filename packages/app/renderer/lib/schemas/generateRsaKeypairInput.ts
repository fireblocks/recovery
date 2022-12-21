import { z } from "zod";
import { nonEmptyString } from "./scalars";

export const generateRsaKeypairInput = z.object({
  passphrase: nonEmptyString().describe("RSA private key passphrase"),
});
