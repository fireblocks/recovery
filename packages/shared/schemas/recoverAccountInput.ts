/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable no-restricted-globals */
import { z } from 'zod';
import { nonEmptyString } from './scalars';

const numberFromString = z
  .string()
  .transform((v) => (v === '' ? null : v))
  .nullable()
  // @ts-ignore
  .refine((v) => v === null || !isNaN(v), { message: 'Invalid number' })
  .transform((v) => (v === null ? -1 : Number(v)))
  .pipe(z.number().nullable());

export const recoverAccountInput = z.object({
  name: nonEmptyString('Account name is required').describe('Vault Account name'),
  id: numberFromString,
});

export const recoverAccountInputByAccounts = (accountKeys: number[]) =>
  z
    .object({
      name: nonEmptyString('Account name is required').describe('Vault Account name'),
      id: numberFromString,
    })
    .superRefine((data, ctx) => {
      if (data.id !== null && accountKeys.includes(data.id)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Account id is already usd, please select another one',
          path: ['id'],
        });
      }
    });

export type RecoverAccountInput = z.infer<typeof recoverAccountInput>;
