import { z } from "zod";

export const withdrawInput = z.object({
  to: z.string().trim().min(1).describe("Recipient address"),
  amount: z.number().positive().describe("Amount to withdraw"),
  memo: z.string().trim().optional().describe("Transaction memo"),
});
