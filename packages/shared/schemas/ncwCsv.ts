import { z } from 'zod';

export const ncwCsvFileInput = z.object({
  walletIdsFile: z
    .custom<File>((value) => value instanceof File)
    .optional()
    .describe('Wallet Id CSV file'),
});

export const ncwCsvInput = z.object({
  walletId: z.string().describe('End user wallet id').regex(/$/g),
});

export type NCWCsvFileInput = z.infer<typeof ncwCsvFileInput>;
export type NCWCsv = z.infer<typeof ncwCsvInput>;
