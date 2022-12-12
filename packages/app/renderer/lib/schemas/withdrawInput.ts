import { z } from "zod";
import { nonEmptyString } from "./scalars";

export const withdrawInput = z.object({
  to: nonEmptyString().describe("Recipient address"),
  amount: z.number().positive().describe("Amount to withdraw"),
});
