import { z } from 'zod';
import { nonEmptyString, optionalString, nonNegativeInt } from './scalars';

export const balancesCsv = z.object({
  accountName: optionalString().describe('Vault account name'),
  accountId: nonNegativeInt().describe('Vault account ID'),
  assetId: nonEmptyString('Asset is required').describe('Asset ID'),
  assetName: nonEmptyString('Asset name is required').describe('Asset name'),
  totalBalance: z.number().nonnegative().describe('Total balance'),
  lastUpdated: z.date().describe('Last update'),
  partialPathParts: z.array(nonNegativeInt()).describe('BIP44 derivation path purpose, coin type, and account'),
});

export type BalancesCsv = z.infer<typeof balancesCsv>;
