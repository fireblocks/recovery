import { z } from "zod";
import { nonEmptyString } from "./scalars";

export const recoverAccountInput = z.object({
  name: nonEmptyString("Account name is required").describe(
    "Vault Account name"
  ),
});

export type RecoverAccountInput = z.infer<typeof recoverAccountInput>;
