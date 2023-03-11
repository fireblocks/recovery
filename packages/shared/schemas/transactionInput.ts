import { z } from 'zod';

export const transactionInput = z.object({
  memo: z.string().optional().describe('Memo to add'),
  utxos: z
    .array(
      z.object({
        txHash: z.string().min(1).describe("UTXO's previous TX hash"),
        index: z.number().nonnegative().describe("UTXO's vout index"),
        value: z.number().positive().describe("UTXO's value"),
        confirmed: z.boolean().describe('Is the UTXO confirmed'),
      }),
    )
    .optional(),
  to: z.string().trim().min(1).describe('Recipient address'),
  amount: z.number().positive().describe('Amount to withdraw'),
});

export type TransactionInput = z.infer<typeof transactionInput>;
