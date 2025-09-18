/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { WalletMaster } from '@fireblocks/extended-key-recovery';
import { RecoveredKey } from '@fireblocks/extended-key-recovery/src/types';
import { z } from 'zod';

export const getExtendedKeySchema = (prefix: 'xpub' | 'xprv' | 'fpub' | 'fprv') =>
  z
    .string()
    .describe(`${prefix} extended key`)
    .trim()
    .regex(new RegExp(`${prefix}[0-9a-zA-Z]{107}$`), `Invalid ${prefix}`);

const keysetMapEntry = z.custom<RecoveredKey>(
  (val: unknown): val is RecoveredKey =>
    typeof val === 'object' &&
    val !== null &&
    'ecdsaExists' in val &&
    'eddsaExists' in val &&
    'ecdsaMinAccount' in val &&
    'eddsaMinAccount' in val &&
    (!val.ecdsaExists || 'xpub' in val) &&
    (!val.eddsaExists || 'fpub' in val),
);

export const keysetKeys = z.object({
  xpub: getExtendedKeySchema('xpub').optional(),
  fpub: getExtendedKeySchema('fpub').optional(),
  xprv: getExtendedKeySchema('xprv').optional(),
  fprv: getExtendedKeySchema('fprv').optional(),
});

const ncwMasterPart = z.object({
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
});

const keysetMap = z.record(z.number(), keysetMapEntry);

export const utilityExtendedKeys = z.intersection(ncwMasterPart, keysetMap).refine((data) => {
  let allHaveMinimumRequiredFields = false;
  for (const key in Object.keys(data)) {
    if (key === 'ncwMaster') {
      continue;
    }

    const keyset = data[key] as RecoveredKey;
    if (!keyset.ecdsaExists && !keyset.eddsaExists) {
      continue;
    }

    if (keyset.ecdsaExists) {
      allHaveMinimumRequiredFields = allHaveMinimumRequiredFields && (keyset.xprv || keyset.xpub) && keyset.ecdsaMinAccount >= 0;
    }
    if (keyset.eddsaExists) {
      allHaveMinimumRequiredFields = allHaveMinimumRequiredFields && (keyset.fprv || keyset.fpub) && keyset.eddsaMinAccount >= 0;
    }

    if (!allHaveMinimumRequiredFields) {
      return false;
    }
  }
  return true;
}, 'At least one extended key is required');

export const relayExtendedKeys = z
  .object({
    xpub: getExtendedKeySchema('xpub').optional(),
    fpub: getExtendedKeySchema('fpub').optional(),
  })
  .refine((data) => data.xpub || data.fpub, 'At least one extended key is required');

export type KeysetMap = z.infer<typeof keysetMap>;
export type UtilityExtendedKeys = z.infer<typeof utilityExtendedKeys>;
export type RelayExtendedKeys = z.infer<typeof relayExtendedKeys>;
export type KeysetKeys = z.infer<typeof keysetKeys>;
