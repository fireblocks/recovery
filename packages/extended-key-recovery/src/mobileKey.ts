import { decryptMobilePrivateKey, decryptMobilePrivateKeyV2 } from './decrypt';
import { getPlayerId } from './players';
import { DecryptMobileKeyError, KeyIdNotInMetadata, MobileKeyShare, SigningKeyMetadata, UnknownAlgorithmError } from './types';

const algorithmMapping: { [key: string]: number } = {
  MPC_ECDSA_SECP256K1: 0,
  MPC_CMP_ECDSA_SECP256K1: 0,
  MPC_EDDSA_ED25519: 1,
  MPC_CMP_EDDSA_ED25519: 1,
};

// The apps encode the passphrase as UTF-8; earlier utility versions used raw char codes (Latin-1), so keep that as a fallback.
const passphraseEncodings = (pass: string): Buffer[] => {
  const utf8 = Buffer.from(pass, 'utf8');
  const legacy = Buffer.from(pass, 'latin1');
  return utf8.equals(legacy) ? [utf8] : [utf8, legacy];
};

// Shape only: 32 B, or 36 B with a 4-byte algorithm prefix. Whether the algorithm matches the key is checked in recoverMobileKeyShare.
const isShareShaped = (share: Buffer): boolean => share.length === 32 || share.length === 36;

// Returns the share bytes from a JSON-wrapped or raw plaintext, or undefined if it is neither.
const extractShare = (plain: Buffer): Buffer | undefined => {
  try {
    const key = JSON.parse(plain.toString()).key;
    if (typeof key === 'string' && /^([0-9a-fA-F]{2})+$/.test(key)) {
      const share = Buffer.from(key, 'hex');
      return isShareShaped(share) ? share : undefined;
    }
  } catch {
    // not JSON
  }
  return isShareShaped(plain) ? plain : undefined;
};

export const recoverMobileKeyShare = (
  signingKeys: { [key: string]: SigningKeyMetadata },
  keyShareStr: string,
  mobilePass: string,
  onLog?: (message: string) => void,
) => {
  const keyShare = JSON.parse(keyShareStr) as MobileKeyShare;
  const { keyId } = keyShare;
  if (!Object.keys(signingKeys).includes(keyId)) {
    throw new KeyIdNotInMetadata();
  }

  const meta = keyShare.encryptionMetaData;
  const encryptedKey = Buffer.from(keyShare.encryptedKey, 'hex');
  const v2 =
    meta?.version === 2 && meta.iv && meta.kdfHash && meta.kdfIterations
      ? { iv: meta.iv, kdfHash: meta.kdfHash, kdfIterations: meta.kdfIterations }
      : undefined;
  onLog?.(
    v2
      ? `[mobileKey] Decrypting share with V2 (kdfHash=${v2.kdfHash}, kdfIterations=${v2.kdfIterations})`
      : `[mobileKey] Decrypting share with V1 (metaVersion=${meta?.version ?? 'none'})`,
  );

  // A wrong passphrase can survive PKCS#7 unpadding (~1/256 for a single 0x01 pad byte), so the plaintext must also be share-shaped.
  // For the 48-byte V1 ciphertexts that means a specific multi-byte pad pattern, which a wrong key essentially never produces;
  // for JSON shares the guard is the JSON parse plus the hex key check.
  let decryptedKey: Buffer | undefined;
  for (const pass of passphraseEncodings(mobilePass)) {
    try {
      const plain = v2
        ? decryptMobilePrivateKeyV2(pass, keyShare.userId, encryptedKey, v2.iv, v2.kdfHash, v2.kdfIterations)
        : decryptMobilePrivateKey(pass, keyShare.userId, encryptedKey);
      decryptedKey = extractShare(plain);
      if (decryptedKey) break;
    } catch {
      // wrong key / bad padding: try the next encoding
    }
  }
  if (!decryptedKey) {
    throw new DecryptMobileKeyError();
  }

  if (decryptedKey.length === 36) {
    const algoId = decryptedKey.subarray(0, 4).readInt32LE();
    if (algorithmMapping[signingKeys[keyId].algo.toString() as string] !== algoId) {
      throw new UnknownAlgorithmError();
    }
    decryptedKey = decryptedKey.subarray(4);
  }

  if (decryptedKey.length === 0) {
    throw new Error(`Decrypted mobile key value is missing`);
  }

  return {
    keyId,
    playerId: getPlayerId(keyId, keyShare.deviceId, false).toString(),
    value: BigInt(`0x${decryptedKey.toString('hex')}`),
  };
};
