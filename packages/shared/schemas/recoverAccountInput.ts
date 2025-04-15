import { z } from 'zod';
import { nonEmptyString } from './scalars';

export const recoverAccountInput = z.object({
  name: nonEmptyString('Account name is required').describe('Vault Account name'),
  id: z.coerce.number().positive().optional(),
});

export const recoverAccountInputByAccounts = (accountKeys: number[]) =>
  z
    .object({
      name: nonEmptyString('Account name is required').describe('Vault Account name'),
      id: z.coerce.number().positive().optional(),
    })
    .superRefine((data, ctx) => {
      if ((data.id !== undefined && accountKeys.includes(data.id)) || data.id === undefined) {
        ctx.addIssue({
          code: 'custom',
          message: 'Account id is already usd, please select another one',
          path: ['id'],
        });
      }
    });

export type RecoverAccountInput = z.infer<typeof recoverAccountInput>;
