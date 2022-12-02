import { z } from "zod";
import { rsaKeyPassphrase } from "./scalars";

export const generateRsaKeypairInput = z.object({
  passphrase: rsaKeyPassphrase(),
});
