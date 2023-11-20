import { z, ZodError, ZodIssue } from 'zod';
import { AddressValidator } from '../lib/validateAddress';
import { getNetworkProtocol } from '@fireblocks/asset-config/util';

export const transactionInitInput = z
  .object({
    assetId: z.string().nonempty('Asset ID is required'),
    accountId: z.number().int('Account ID must be an integer').nonnegative('Invalid Account ID'),
    to: z.string().nonempty('To address is required'),
  })
  .refine((data) => {
    if (!validateAddress(data.to, data.assetId)) {
      throw createZodError('Invalid address format', ['to']);
    }
    return true;
  });

function validateAddress(address: string, assetId: string): boolean {
  const destAddressValidator = new AddressValidator();
  const networkProtocol: string | undefined = getNetworkProtocol(assetId);
  return destAddressValidator.isValidAddress(address, networkProtocol, assetId);
}

function createZodError(message: string, path: string[]): ZodError {
  const issue: ZodIssue = {
    path,
    message,
    code: 'custom',
  };
  return new ZodError([issue]);
}

export type TransactionInitInput = z.infer<typeof transactionInitInput>;
