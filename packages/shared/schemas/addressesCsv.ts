import { z } from 'zod';
import { nonEmptyString, optionalString, nonNegativeInt } from './scalars';

export const addressesCsv = z.object({
  accountName: optionalString().describe('Vault account name'),
  accountId: nonNegativeInt().describe('Vault account ID'),
  assetId: nonEmptyString('Asset is required').describe('Asset ID'),
  assetName: nonEmptyString('Asset name is required').describe('Asset name'),
  address: nonEmptyString('Address is required').describe('Address'),
  addressType: z.enum(['Permanent', 'Deposit']).describe('Address type'),
  addressDescription: optionalString().describe('Address description'),
  tag: optionalString().describe('Address tag'),
  pathParts: z.array(nonNegativeInt()).describe('BIP44 derivation path parts'),
  publicKey: optionalString().describe('Public key hexadecimal'),
  privateKey: optionalString().describe('Private key hexadecimal'),
  privateKeyWif: optionalString().describe('Private key in Wallet Import Format (WIF)'),
});

export type AddressesCsv = z.infer<typeof addressesCsv>;
