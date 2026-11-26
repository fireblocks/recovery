import { createCipheriv, pbkdf2Sync } from 'crypto';
import { secp256k1 } from '@noble/curves/secp256k1';
import { getAlgorithmFromString } from '../src/algorithms';
import { reconstructKeys } from '../src/reconstructKeys';
import { recoverMobileKeyShare } from '../src/mobileKey';
import { SigningKeysMap } from '../src/metadata';
import { PlayerData, UnknownAlgorithmError } from '../src/types';

const KEY_ID = 'bam-keyset';
const CHAIN_CODE = Buffer.alloc(32, 7);

// BAM is an additive n-of-n scheme with two parties, so the shares sum to the private key.
const SHARE_A = BigInt('0x1111111111111111111111111111111111111111111111111111111111111111');
const SHARE_B = BigInt('0x3333333333333333333333333333333333333333333333333333333333333333');
const PRIVATE_KEY = (SHARE_A + SHARE_B) % secp256k1.CURVE.n;
const PUBLIC_KEY = secp256k1.ProjectivePoint.BASE.multiply(PRIVATE_KEY).toHex();

const bamSigningKeys = {
  [KEY_ID]: {
    publicKey: PUBLIC_KEY,
    chainCode: CHAIN_CODE,
    algo: 'MPC_BAM_ECDSA_SECP256K1',
    keysetId: 1,
  },
} as unknown as SigningKeysMap;

const bamPlayers: PlayerData = {
  [KEY_ID]: { '1': SHARE_A, '2': SHARE_B },
};

describe('MPC_BAM_ECDSA_SECP256K1', () => {
  it('is a recognized algorithm', () => {
    expect(getAlgorithmFromString('MPC_BAM_ECDSA_SECP256K1')).toEqual('MPC_BAM_ECDSA_SECP256K1');
  });

  it('reconstructs the private key by summing the two additive shares', () => {
    const recovered = reconstructKeys(bamPlayers, bamSigningKeys);

    // reconstructKeys returns undefined when the derived public key does not match the
    // one published in the kit, so a defined result proves the combination formula is right.
    expect(recovered).toBeDefined();
    expect(recovered![1]['MPC_BAM_ECDSA_SECP256K1']).toBeDefined();
  });

  it('rejects reconstruction when the shares do not match the published public key', () => {
    // A share set that sums to a different private key than the one whose public key
    // is in bamSigningKeys — reconstructKeys must not silently return a wrong key.
    const wrongPlayers: PlayerData = {
      [KEY_ID]: { '1': SHARE_A, '2': SHARE_A },
    };

    const recovered = reconstructKeys(wrongPlayers, bamSigningKeys);

    expect(recovered).toBeUndefined();
  });

  it('decrypts a BAM mobile key share', () => {
    const pass = 'Fireblocks1!';
    const userId = 'ce9b7e2a-6f3d-4c1b-9a25-1d8f0c4e7b33';
    const deviceId = '278d187c-024b-40d6-bef3-917ed0df8afe';
    const iv = '0102030405060708090a0b0c0d0e0f10';
    const keyMaterial = Buffer.alloc(32, 9);

    // Mobile shares carry a 4-byte little-endian curve tag; secp256k1 is 0.
    const plaintext = Buffer.concat([Buffer.from('00000000', 'hex'), keyMaterial]);
    const wrappedKey = pbkdf2Sync(pass, userId, 1000000, 32, 'sha256');
    const cipher = createCipheriv('aes-256-cbc', wrappedKey, Buffer.from(iv, 'hex'));
    const encryptedKey = Buffer.concat([cipher.update(plaintext), cipher.final()]).toString('hex');

    const keyShare = JSON.stringify({
      encryptedKey,
      keyId: KEY_ID,
      deviceId,
      userId,
      encryptionAlgorithm: 'AES-CBC',
      encryptionMetaData: { version: 2, iv, kdfHash: 'sha256', kdfIterations: 1000000 },
    });

    const recovered = recoverMobileKeyShare(bamSigningKeys, keyShare, pass);

    expect(recovered.keyId).toEqual(KEY_ID);
    expect(recovered.value).toEqual(BigInt(`0x${keyMaterial.toString('hex')}`));
  });

  it('rejects a BAM mobile key share tagged with an unrecognized algorithm id', () => {
    const pass = 'Fireblocks1!';
    const userId = 'ce9b7e2a-6f3d-4c1b-9a25-1d8f0c4e7b33';
    const deviceId = '278d187c-024b-40d6-bef3-917ed0df8afe';
    const iv = '0102030405060708090a0b0c0d0e0f10';
    const keyMaterial = Buffer.alloc(32, 9);

    // 9999 (0x270f) — not the curve id (0) this algorithm expects.
    const plaintext = Buffer.concat([Buffer.from('0f270000', 'hex'), keyMaterial]);
    const wrappedKey = pbkdf2Sync(pass, userId, 1000000, 32, 'sha256');
    const cipher = createCipheriv('aes-256-cbc', wrappedKey, Buffer.from(iv, 'hex'));
    const encryptedKey = Buffer.concat([cipher.update(plaintext), cipher.final()]).toString('hex');

    const keyShare = JSON.stringify({
      encryptedKey,
      keyId: KEY_ID,
      deviceId,
      userId,
      encryptionAlgorithm: 'AES-CBC',
      encryptionMetaData: { version: 2, iv, kdfHash: 'sha256', kdfIterations: 1000000 },
    });

    expect(() => recoverMobileKeyShare(bamSigningKeys, keyShare, pass)).toThrow(UnknownAlgorithmError);
  });

  it('encodes reconstructed BAM keys with the exact expected secp256k1 extended keys', () => {
    const recovered = reconstructKeys(bamPlayers, bamSigningKeys);
    const bamKey = recovered![1]['MPC_BAM_ECDSA_SECP256K1']!;

    expect(bamKey.prvKey).toEqual(
      'xprv9s21ZrQH143K28R2wd667RHH4jRK5oEyhWQyzPYNyNXY4XQDTAA9VY1umqWKWgqVqc4CiuUh18wDC3ScfLAmDxPZNCZibExtUKjjkHdkRYJ',
    );
    expect(bamKey.pubKey).toEqual(
      'xpub661MyMwAqRbcEcVW3ed6UZE1cmFoVFxq4jLanmwzXi4WwKjMzhUQ3LLPd8JARCKnvHx31CJzF7Df2vbYVhRzWo3JRrzvtQFVpyuUFuy9kCs',
    );
  });
});
