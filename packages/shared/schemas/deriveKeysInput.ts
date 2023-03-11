import { z } from 'zod';
import { nonNegativeInt } from './scalars';

export const deriveKeysInput = z
  .object({
    accountId: nonNegativeInt().describe('Vault account ID'),
    indexStart: nonNegativeInt().describe('BIP44 address index start'),
    indexEnd: nonNegativeInt().describe('BIP44 address index end'),
  })
  .refine((data) => data.indexStart <= data.indexEnd, 'Index start must be less than or equal to Index end');

export type DeriveKeysInput = z.infer<typeof deriveKeysInput>;
