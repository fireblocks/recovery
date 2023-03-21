import { z } from 'zod';

export const importCsvInput = z.object({
  addressesCsv: z
    .custom<File>((value) => value instanceof File)
    .optional()
    .describe('Address backup CSV file'),
  balancesCsv: z
    .custom<File>((value) => value instanceof File)
    .optional()
    .describe('Balances backup CSV file'),
});

export type ImportCsvInput = z.infer<typeof importCsvInput>;
