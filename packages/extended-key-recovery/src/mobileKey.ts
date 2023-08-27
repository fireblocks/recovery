import { decryptMobilePrivateKey } from './decrypt';
import { getPlayerId } from './players';
import { DecryptMobileKeyError, KeyIdNotInMetadata, MobileKeyShare, SigningKeyMetadata, UnknownAlgorithmError } from './types';

const algorithmMapping: { [key: string]: number } = {
  MPC_ECDSA_SECP256K1: 0,
  MPC_CMP_ECDSA_SECP256K1: 0,
  MPC_EDDSA_ED25519: 1,
  MPC_CMP_EDDSA_ED25519: 1,
};

export const recoverMobileKeyShare = (
  signingKeys: { [key: string]: SigningKeyMetadata },
  keyShareStr: string,
  mobilePass: string,
) => {
  const keyShare = JSON.parse(keyShareStr) as MobileKeyShare;
  const { keyId } = keyShare;
  let decryptedKey: Buffer;
  if (!Object.keys(signingKeys).includes(keyId)) {
    throw new KeyIdNotInMetadata();
  }

  try {
    decryptedKey = decryptMobilePrivateKey(mobilePass, keyShare.userId, Buffer.from(keyShare.encryptedKey, 'hex'));
  } catch (e) {
    throw new DecryptMobileKeyError();
  }

  // In case the decrypted data is actually a JSON, load and try got get the key
  try {
    const decryptedJSON = JSON.parse(decryptedKey.toString());
    decryptedKey = Buffer.from(decryptedJSON.key, 'hex');
    // eslint-disable-next-line no-empty
  } catch {}

  if (decryptedKey.length === 36) {
    const algoId = decryptedKey.subarray(0, 4).readInt32LE();
    if (algorithmMapping[signingKeys[keyId].algo.toString() as string] !== algoId) {
      throw new UnknownAlgorithmError();
    }
    decryptedKey = decryptedKey.subarray(0, 4);
  }

  return {
    keyId,
    playerId: getPlayerId(keyId, keyShare.deviceId, false).toString(),
    value: BigInt(`0x${decryptedKey.toString('hex')}`),
  };
};
