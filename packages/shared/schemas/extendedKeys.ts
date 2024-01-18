/* eslint-disable @typescript-eslint/ban-ts-comment */
import { WalletMaster } from '@fireblocks/extended-key-recovery';
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
    ncwMaster: z
      .custom<WalletMaster>((val) =>
        typeof val === 'object'
          ? // @ts-ignore
            val.walletSeed &&
            // @ts-ignore
            val.assetSeed &&
            // @ts-ignore
            typeof val.masterKeyForCosigner === 'object' &&
            // @ts-ignore
            Object.keys(val.masterKeyForCosigner).every((v) => typeof v === 'string')
          : false,
      )
      .optional(),
  })
  .refine((data) => data.xpub || data.fpub || data.xprv || data.fprv, 'At least one extended key is required');

export type ExtendedKeys = z.infer<typeof extendedKeys>;
