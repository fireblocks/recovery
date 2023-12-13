import { string, z } from 'zod';

export const generateRsaKeypairInput = z.object({
  passphrase: string().min(8, 'Passphrase must be at least 8 characters').describe('Recovery private key passphrase').optional(),
});

export type GenerateRsaKeypairInput = z.infer<typeof generateRsaKeypairInput>;
