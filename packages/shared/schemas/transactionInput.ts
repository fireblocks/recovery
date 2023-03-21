import { z } from 'zod';

export const transactionInput = z.object({
  fromAddress: z.string().trim().nonempty('From address required'),
  toAddress: z.string().trim().nonempty('Recipient address required'),
  memo: z.string().optional(),
  utxos: z
    .array(
      z.object({
        txHash: z.string().nonempty("UTXO's previous tx hash required"),
        index: z.number().nonnegative("UTXO's vout index required"),
        value: z.number().positive("UTXO's value required"),
        confirmed: z.boolean(),
      }),
    )
    .optional(),
  endpoint: z.string().optional().describe('Endpoint data for specific blockchains'),
});

export type TransactionInput = z.infer<typeof transactionInput>;
