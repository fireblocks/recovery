import { z } from 'zod';
import { nonEmptyString } from './scalars';

export const generateRsaKeypairInput = z.object({
  passphrase: nonEmptyString('Recovery private key passphrase is required')
    .min(4, 'Passphrase must be at least 4 characters')
    .describe('Recovery private key passphrase'),
});

export type GenerateRsaKeypairInput = z.infer<typeof generateRsaKeypairInput>;
