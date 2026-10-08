import { pbkdf2Sync, createDecipheriv } from 'crypto';

export const decryptMobilePrivateKeyV2 = (
  pass: string | Buffer,
  userId: string,
  encryptedKey: Buffer,
  iv: string,
  kdfHash: string,
  kdfIterations: number,
): Buffer => {
  const digest = kdfHash.toUpperCase() === 'SHA256' ? 'sha256' : 'sha1';
  const wrappedKey = pbkdf2Sync(pass, userId, kdfIterations, 32, digest);
  const decipher = createDecipheriv('aes-256-cbc', wrappedKey, Buffer.from(iv, 'hex'));
  return Buffer.concat([decipher.update(encryptedKey), decipher.final()]);
};

// Strict PKCS#7: Node rejects any ciphertext whose padding bytes are inconsistent, as the mobile apps do.
export const decryptMobilePrivateKey = (pass: string | Buffer, userId: string, encryptedKey: Buffer): Buffer => {
  const wrappedKey = pbkdf2Sync(pass, userId, 10000, 32, 'sha1');
  const decipher = createDecipheriv('aes-256-cbc', wrappedKey, Buffer.alloc(16));
  return Buffer.concat([decipher.update(encryptedKey), decipher.final()]);
};
