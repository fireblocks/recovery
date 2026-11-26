import { createCipheriv, pbkdf2Sync } from 'crypto';
import { ed25519 } from '@noble/curves/ed25519';
import { getAlgorithmFromString } from '../src/algorithms';
import { reconstructKeys } from '../src/reconstructKeys';
import { recoverMobileKeyShare } from '../src/mobileKey';
import { SigningKeysMap } from '../src/metadata';
import { PlayerData, UnknownAlgorithmError } from '../src/types';

const KEY_ID = 'frost-keyset';
const CHAIN_CODE = Buffer.alloc(32, 7);

// FROST is the EdDSA counterpart of BAM: additive n-of-n over ed25519, two parties.
const SHARE_A = BigInt('0x1111111111111111111111111111111111111111111111111111111111111111');
const SHARE_B = BigInt('0x3333333333333333333333333333333333333333333333333333333333333333');
const PRIVATE_KEY = (SHARE_A + SHARE_B) % ed25519.CURVE.n;
const PUBLIC_KEY = ed25519.ExtendedPoint.BASE.multiply(PRIVATE_KEY).toHex();

const frostSigningKeys = {
  [KEY_ID]: {
    publicKey: PUBLIC_KEY,
    chainCode: CHAIN_CODE,
    algo: 'MPC_FROST_EDDSA_ED25519',
    keysetId: 1,
  },
} as unknown as SigningKeysMap;

const frostPlayers: PlayerData = {
  [KEY_ID]: { '1': SHARE_A, '2': SHARE_B },
};

describe('MPC_FROST_EDDSA_ED25519', () => {
  it('is a recognized algorithm', () => {
    expect(getAlgorithmFromString('MPC_FROST_EDDSA_ED25519')).toEqual('MPC_FROST_EDDSA_ED25519');
  });

  it('reconstructs the private key by summing the two additive shares', () => {
    const recovered = reconstructKeys(frostPlayers, frostSigningKeys);

    expect(recovered).toBeDefined();
    expect(recovered![1]['MPC_FROST_EDDSA_ED25519']).toBeDefined();
  });

  it('rejects reconstruction when the shares do not match the published public key', () => {
    const wrongPlayers: PlayerData = {
      [KEY_ID]: { '1': SHARE_A, '2': SHARE_A },
    };

    const recovered = reconstructKeys(wrongPlayers, frostSigningKeys);

    expect(recovered).toBeUndefined();
  });

  it('decrypts a FROST mobile key share', () => {
    const pass = 'Fireblocks1!';
    const userId = 'ce9b7e2a-6f3d-4c1b-9a25-1d8f0c4e7b33';
    const deviceId = '278d187c-024b-40d6-bef3-917ed0df8afe';
    const iv = '0102030405060708090a0b0c0d0e0f10';
    const keyMaterial = Buffer.alloc(32, 9);

    // Mobile shares carry a 4-byte little-endian curve tag; ed25519 is 1.
    const plaintext = Buffer.concat([Buffer.from('01000000', 'hex'), keyMaterial]);
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

    const recovered = recoverMobileKeyShare(frostSigningKeys, keyShare, pass);

    expect(recovered.keyId).toEqual(KEY_ID);
    expect(recovered.value).toEqual(BigInt(`0x${keyMaterial.toString('hex')}`));
  });

  it('rejects a FROST mobile key share tagged with an unrecognized algorithm id', () => {
    const pass = 'Fireblocks1!';
    const userId = 'ce9b7e2a-6f3d-4c1b-9a25-1d8f0c4e7b33';
    const deviceId = '278d187c-024b-40d6-bef3-917ed0df8afe';
    const iv = '0102030405060708090a0b0c0d0e0f10';
    const keyMaterial = Buffer.alloc(32, 9);

    // 9999 (0x270f) — not the curve id (1) this algorithm expects.
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

    expect(() => recoverMobileKeyShare(frostSigningKeys, keyShare, pass)).toThrow(UnknownAlgorithmError);
  });

  it('encodes reconstructed FROST keys with the exact expected ed25519 extended keys', () => {
    const recovered = reconstructKeys(frostPlayers, frostSigningKeys);
    const frostKey = recovered![1]['MPC_FROST_EDDSA_ED25519']!;

    expect(frostKey.prvKey).toEqual(
      'fprv4LsXPWzhTTp9a6A2mXiUZvfj9Gwi5FPW8bZEggLKXG7a9pZL9yMavTqZRKjAkCMqSsPhCMxFTkWNAqsK3kQD31pGq5ghRLFHgxEUYRq27XV',
    );
    expect(frostKey.pubKey).toEqual(
      'fpub8sZZXw2wbqVpTZBpfBP4yLKqiJTeEaaQhuA1yCNcwXuxzJp6nNBB6xTRbPNMUC6AaNnv6LwNQc3mtkDJHDJ5XUP22CCxCCRMjDjdauxCviW',
    );
  });
});
