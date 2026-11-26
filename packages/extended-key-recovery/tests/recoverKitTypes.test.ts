import { constants, createCipheriv, generateKeyPairSync, pbkdf2Sync, publicEncrypt } from 'crypto';
import AdmZip from 'adm-zip';
import { secp256k1 } from '@noble/curves/secp256k1';
import { ed25519 } from '@noble/curves/ed25519';
import { encode } from 'bs58check';
import { recoverKeys } from '../index';
import { Algorithm, ECDSA_BAM, ECDSA_CMP, EDDSA, EDDSA_FROST } from '../src/algorithms';
import { getPlayerId } from '../src/players';
import { KeyRecoveryConfig } from '../src/types';

const MOBILE_PASS = 'Fireblocks1!';
const USER_ID = 'ce9b7e2a-6f3d-4c1b-9a25-1d8f0c4e7b33';
const DEVICE_ID = '278d187c-024b-40d6-bef3-917ed0df8afe';
const CLOUD_COSIGNERS = ['3429798433', '923242535'];
const CHAIN_CODE = '5d90bd21d2273a25d0aea082716bdc4529e007823260ad3479182f6672c25cc4';
const IV = '0102030405060708090a0b0c0d0e0f10';
const KDF_ITERATIONS = 1_000_000;

// A 32-byte value with every byte set to `byte`, e.g. repeatedByte('11') = 0x1111...11.
const repeatedByte = (byte: string) => BigInt(`0x${byte.repeat(32)}`);

const ECDSA_KEY = repeatedByte('1f') % secp256k1.CURVE.n;
const EDDSA_KEY = repeatedByte('3c') % ed25519.CURVE.n;

type KitKey = {
  keyId: string;
  algo: Algorithm;
  publicKey: string;
  // Mobile share first, then one share per cloud cosigner.
  shares: bigint[];
};

const mod = (value: bigint, order: bigint) => ((value % order) + order) % order;

const additiveShares = (key: bigint, order: bigint, cloudShares: bigint[]): bigint[] => [
  mod(
    cloudShares.reduce((rest, share) => rest - share, key),
    order,
  ),
  ...cloudShares,
];

// Legacy GG keys are Shamir-shared: each party holds f(playerId) for f(x) = key + a1*x + a2*x^2.
const shamirShares = (key: bigint, order: bigint, keyId: string, coefficients: bigint[]): bigint[] => {
  const playerIds = [
    getPlayerId(keyId, DEVICE_ID, false),
    ...CLOUD_COSIGNERS.map((cosigner) => getPlayerId(keyId, cosigner, true)),
  ];
  return playerIds.map((x) =>
    mod(
      coefficients.reduce((sum, a, i) => sum + a * x ** BigInt(i + 1), key),
      order,
    ),
  );
};

const toBytes = (value: bigint) => Buffer.from(value.toString(16).padStart(64, '0'), 'hex');

const ecdsaPublicKey = secp256k1.ProjectivePoint.BASE.multiply(ECDSA_KEY).toHex();
const eddsaPublicKey = ed25519.ExtendedPoint.BASE.multiply(EDDSA_KEY).toHex();

const GG_EDDSA_KEY_ID = 'a1b2c3d4-0000-4000-8000-000000000002';

// BAM and FROST are separate splits of the same keys as CMP ECDSA and GG EdDSA.
const CMP_ECDSA: KitKey = {
  keyId: 'a1b2c3d4-0000-4000-8000-000000000001',
  algo: ECDSA_CMP,
  publicKey: ecdsaPublicKey,
  shares: additiveShares(ECDSA_KEY, secp256k1.CURVE.n, [repeatedByte('11'), repeatedByte('22')]),
};
const GG_EDDSA: KitKey = {
  keyId: GG_EDDSA_KEY_ID,
  algo: EDDSA,
  publicKey: eddsaPublicKey,
  shares: shamirShares(EDDSA_KEY, ed25519.CURVE.n, GG_EDDSA_KEY_ID, [repeatedByte('33'), repeatedByte('44')]),
};
const BAM: KitKey = {
  keyId: 'a1b2c3d4-0000-4000-8000-000000000003',
  algo: ECDSA_BAM,
  publicKey: ecdsaPublicKey,
  shares: additiveShares(ECDSA_KEY, secp256k1.CURVE.n, [repeatedByte('55')]),
};
const FROST: KitKey = {
  keyId: 'a1b2c3d4-0000-4000-8000-000000000004',
  algo: EDDSA_FROST,
  publicKey: eddsaPublicKey,
  shares: additiveShares(EDDSA_KEY, ed25519.CURVE.n, [repeatedByte('66')]),
};

let rsaPublicKey: string;
let rsaPrivateKey: string;
let mobileWrappingKey: Buffer;

beforeAll(() => {
  ({ publicKey: rsaPublicKey, privateKey: rsaPrivateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
  }));
  mobileWrappingKey = pbkdf2Sync(MOBILE_PASS, USER_ID, KDF_ITERATIONS, 32, 'sha256');
});

// As in real kits: GG mobile shares are the raw 32-byte share, the others are JSON-wrapped.
const mobileSharePlaintext = (algo: Algorithm, share: bigint): Buffer =>
  algo === EDDSA ? toBytes(share) : Buffer.from(JSON.stringify({ key: toBytes(share).toString('hex') }));

const mobileShareFile = ({ keyId, algo }: KitKey, share: bigint): Buffer => {
  const cipher = createCipheriv('aes-256-cbc', mobileWrappingKey, Buffer.from(IV, 'hex'));
  const plaintext = mobileSharePlaintext(algo, share);
  const encryptedKey = Buffer.concat([cipher.update(plaintext), cipher.final()]).toString('hex');
  return Buffer.from(
    JSON.stringify({
      encryptedKey,
      keyId,
      deviceId: DEVICE_ID,
      userId: USER_ID,
      encryptionAlgorithm: 'AES-CBC',
      encryptionMetaData: { version: 2, iv: IV, kdfHash: 'SHA256', kdfIterations: KDF_ITERATIONS },
    }),
  );
};

const cloudShareFile = (share: bigint): Buffer =>
  publicEncrypt({ key: rsaPublicKey, padding: constants.RSA_PKCS1_OAEP_PADDING }, toBytes(share));

const buildKit = (keys: KitKey[]): string => {
  const zip = new AdmZip();
  const metadata = {
    chainCode: CHAIN_CODE,
    tenantId: 'a1b2c3d4-0000-4000-8000-0000000000ff',
    keys: Object.fromEntries(
      keys.map(({ keyId, algo, publicKey, shares }) => [
        keyId,
        {
          publicKey,
          keysetId: 1,
          algo,
          cosigners: [
            { id: DEVICE_ID, type: 'mobile' },
            ...CLOUD_COSIGNERS.slice(0, shares.length - 1).map((id) => ({ id, type: 'cloud' })),
          ],
        },
      ]),
    ),
  };
  zip.addFile('metadata.json', Buffer.from(JSON.stringify(metadata)));
  keys.forEach((key) => {
    const [mobileShare, ...cloudShares] = key.shares;
    zip.addFile(`MOBILE_${key.keyId}`, mobileShareFile(key, mobileShare));
    cloudShares.forEach((share, i) => zip.addFile(`${CLOUD_COSIGNERS[i]}_${key.keyId}`, cloudShareFile(share)));
  });
  return zip.toBuffer().toString('base64');
};

const recover = (keys: KitKey[]) => {
  const config: KeyRecoveryConfig = {
    zipBase64: buildKit(keys),
    rsaBase64: Buffer.from(rsaPrivateKey).toString('base64'),
    rsaPass: '',
    mobilePass: MOBILE_PASS,
    recoveryPrv: true,
    recoverOnlyNCW: false,
  };
  return recoverKeys(config)[1];
};

// Extended keys built directly from the known keys: version, depth/fingerprint/index (9 zero bytes), chain code, key.
const extendedKey = (version: string, key: Buffer) =>
  encode(Buffer.concat([Buffer.from(version, 'hex'), Buffer.alloc(9), Buffer.from(CHAIN_CODE, 'hex'), key]));

const EXPECTED = {
  xprv: extendedKey('0488ADE4', Buffer.concat([Buffer.alloc(1), toBytes(ECDSA_KEY)])),
  xpub: extendedKey('0488B21E', Buffer.from(ecdsaPublicKey, 'hex')),
  fprv: extendedKey('03273a10', Buffer.concat([Buffer.alloc(1), toBytes(EDDSA_KEY)])),
  fpub: extendedKey('03273e4b', Buffer.concat([Buffer.alloc(1), Buffer.from(eddsaPublicKey, 'hex')])),
};

describe('recoverKeys by kit type', () => {
  it('recovers a CMP-only kit', () => {
    expect(recover([CMP_ECDSA, GG_EDDSA])).toEqual(expect.objectContaining(EXPECTED));
  });

  it('recovers a kit holding both CMP and BAM/FROST keys', () => {
    expect(recover([CMP_ECDSA, GG_EDDSA, BAM, FROST])).toEqual(expect.objectContaining(EXPECTED));
  });

  it('recovers a BAM/FROST-only kit', () => {
    expect(recover([BAM, FROST])).toEqual(expect.objectContaining(EXPECTED));
  });
});
