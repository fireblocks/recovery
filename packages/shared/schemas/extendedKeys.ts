import { z } from 'zod';

const getExtendedKeySchema = (prefix: 'xpub' | 'xprv' | 'fpub' | 'fprv') =>
  z
    .string()
    .describe(`${prefix} extended key`)
    .trim()
    .regex(new RegExp(`${prefix}[0-9a-zA-Z]{107}$`), `Invalid ${prefix}`)
    .optional();

export const extendedKeys = z
  .object({
    xpub: getExtendedKeySchema('xpub'),
    fpub: getExtendedKeySchema('fpub'),
    xprv: getExtendedKeySchema('xprv'),
    fprv: getExtendedKeySchema('fprv'),
  })
  .refine((data) => data.xpub || data.fpub || data.xprv || data.fprv, 'At least one extended key is required');

export type ExtendedKeys = z.infer<typeof extendedKeys>;
