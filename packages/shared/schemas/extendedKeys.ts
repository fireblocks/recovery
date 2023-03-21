import { z } from 'zod';

export const getExtendedKeySchema = (prefix: 'xpub' | 'xprv' | 'fpub' | 'fprv') =>
  z
    .string()
    .describe(`${prefix} extended key`)
    .trim()
    .regex(new RegExp(`${prefix}[0-9a-zA-Z]{107}$`), `Invalid ${prefix}`);

export const extendedKeys = z
  .object({
    xpub: getExtendedKeySchema('xpub').optional(),
    fpub: getExtendedKeySchema('fpub').optional(),
    xprv: getExtendedKeySchema('xprv').optional(),
    fprv: getExtendedKeySchema('fprv').optional(),
  })
  .refine((data) => data.xpub || data.fpub || data.xprv || data.fprv, 'At least one extended key is required');

export type ExtendedKeys = z.infer<typeof extendedKeys>;
