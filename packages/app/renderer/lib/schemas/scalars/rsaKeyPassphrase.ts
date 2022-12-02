import { z } from "zod";

export const rsaKeyPassphrase = () =>
  z.string().trim().optional().describe("RSA private key passphrase");
