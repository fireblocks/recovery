import { z } from 'zod';

export const transactionInitInput = z.object({
  assetId: z.string().nonempty('Asset ID is required'),
  accountId: z.number().int('Account ID must be an integer').nonnegative('Invalid Account ID'),
  to: z.string().nonempty('To address is required'),
});

export type TransactionInitInput = z.infer<typeof transactionInitInput>;
