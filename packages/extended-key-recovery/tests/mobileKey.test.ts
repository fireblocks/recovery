import { createCipheriv, pbkdf2Sync, randomBytes } from 'crypto';
import { decryptMobilePrivateKey } from '../src/decrypt';
import { recoverMobileKeyShare } from '../src/mobileKey';
import { DecryptMobileKeyError, UnknownAlgorithmError } from '../src/types';

const KEY_ID = '00000000-0000-4000-8000-000000000001';
const USER_ID = '00000000-0000-4000-8000-000000000002';
const DEVICE_ID = '00000000-0000-4000-8000-000000000003';
const ALGO_CMP_ECDSA = 0;

const signingKeys: any = { [KEY_ID]: { algo: 'MPC_CMP_ECDSA_SECP256K1', keysetId: 1 } };

// Mirrors how the mobile apps wrap a V1 share: PBKDF2-HMAC-SHA1(10k) over the UTF-8 passphrase, zero IV, AES-256-CBC.
const encryptV1 = (plaintext: Buffer, pass: string): Buffer => {
  const key = pbkdf2Sync(Buffer.from(pass, 'utf8'), USER_ID, 10000, 32, 'sha1');
  const cipher = createCipheriv('aes-256-cbc', key, Buffer.alloc(16));
  return Buffer.concat([cipher.update(plaintext), cipher.final()]);
};

const buildShare = (plaintext: Buffer, pass: string): string =>
  JSON.stringify({
    keyId: KEY_ID,
    userId: USER_ID,
    deviceId: DEVICE_ID,
    encryptedKey: encryptV1(plaintext, pass).toString('hex'),
  });

const rawShare = () => randomBytes(32);
const prefixedShare = () => Buffer.concat([Buffer.from([ALGO_CMP_ECDSA, 0, 0, 0]), randomBytes(32)]);
const jsonShare = () => Buffer.from(JSON.stringify({ key: randomBytes(32).toString('hex'), pad: 'x'.repeat(200) }));

const wrongPassphrases = (n: number): string[] => Array.from({ length: n }, (_, i) => `wrong-passphrase-${i}-Aa1!`);

const tryRecover = (share: string, pass: string): 'ok' | 'rejected' => {
  try {
    recoverMobileKeyShare(signingKeys, share, pass);
    return 'ok';
  } catch (e) {
    if (e instanceof DecryptMobileKeyError) return 'rejected';
    throw e;
  }
};

describe('V1 mobile share decryption', () => {
  const PASS = 'Correct-Horse-1!';

  it.each([
    ['raw 32 byte share', rawShare],
    ['36 byte algo-prefixed share', prefixedShare],
    ['JSON share', jsonShare],
  ])('recovers a %s with the right passphrase', (_name, make) => {
    expect(tryRecover(buildShare(make(), PASS), PASS)).toBe('ok');
  });

  it.each([
    ['raw 32 byte share', rawShare],
    ['36 byte algo-prefixed share', prefixedShare],
    ['JSON share', jsonShare],
  ])('never returns key material for a wrong passphrase (%s)', (_name, make) => {
    const share = buildShare(make(), PASS);
    const accepted = wrongPassphrases(300).filter((p) => tryRecover(share, p) === 'ok');
    expect(accepted).toEqual([]);
  });

  it('reports an unknown algorithm, not a passphrase error, when the passphrase is correct', () => {
    const unknownAlgo = Buffer.concat([Buffer.from([2, 0, 0, 0]), randomBytes(32)]);
    expect(() => recoverMobileKeyShare(signingKeys, buildShare(unknownAlgo, PASS), PASS)).toThrow(UnknownAlgorithmError);
  });

  it('rejects data whose padding bytes are inconsistent', () => {
    const key = pbkdf2Sync(Buffer.from(PASS, 'utf8'), USER_ID, 10000, 32, 'sha1');
    const cipher = createCipheriv('aes-256-cbc', key, Buffer.alloc(16));
    cipher.setAutoPadding(false);
    // 48 bytes ending in 0x05 but with non-matching preceding bytes
    const bad = Buffer.concat([randomBytes(43), Buffer.from([1, 2, 3, 4, 5])]);
    const enc = Buffer.concat([cipher.update(bad), cipher.final()]);
    expect(() => decryptMobilePrivateKey(PASS, USER_ID, enc)).toThrow();
  });

  it.each(['é', 'Pässwörd1!', '£€’pass1A', 'пароль-Aa1'])('recovers a share protected by the non-ASCII passphrase %s', (pass) => {
    expect(tryRecover(buildShare(rawShare(), pass), pass)).toBe('ok');
  });

  it('still recovers a share wrapped with the legacy raw-char-code encoding', () => {
    const pass = 'Pässwörd1!';
    const key = pbkdf2Sync(Buffer.from(pass, 'latin1'), USER_ID, 10000, 32, 'sha1');
    const cipher = createCipheriv('aes-256-cbc', key, Buffer.alloc(16));
    const enc = Buffer.concat([cipher.update(rawShare()), cipher.final()]).toString('hex');
    const share = JSON.stringify({ keyId: KEY_ID, userId: USER_ID, deviceId: DEVICE_ID, encryptedKey: enc });
    expect(tryRecover(share, pass)).toBe('ok');
  });
});
