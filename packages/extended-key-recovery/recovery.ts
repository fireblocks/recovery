/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable prefer-const */
/* eslint-disable guard-for-in */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-continue */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-lonely-if */
/* eslint-disable global-require */
/* eslint-disable no-await-in-loop */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-restricted-syntax */

import fs from 'fs';
import path from 'path';
import forge from 'node-forge';
import struct from 'python-struct';
import { secp256k1 } from '@noble/curves/secp256k1';
import { ed25519 } from '@noble/curves/ed25519';
import AdmZip, { IZipEntry } from 'adm-zip';
import { modPow } from 'bigint-mod-arith';
import { encode as encode_b58check } from 'bs58check';
import {
  Algorithm,
  CalculatedPrivateKey,
  DecryptMobileKeyError,
  DecryptRSAPrivateKeyError,
  FinalizedMetadataKey,
  InvalidRSAPrivateKeyError,
  InvalidRecoveryKitError,
  KeyIdMissingError,
  KeyIdNotInMetadata,
  KeyRecoveryConfig,
  KeyShareMetadata,
  MetadataKey,
  MobileKeyShare,
  NoMetadataError,
  NoRSAPassphraseError,
  RecoveredKeys,
  UnknownAlgorithmError,
  UnknownChainCodeError,
} from './types';

const algorithmMapping: { [key: string]: number } = {
  MPC_ECDSA_SECP256K1: 0,
  MPC_CMP_ECDSA_SECP256K1: 0,
  MPC_EDDSA_ED25519: 1,
  MPC_CMP_EDDSA_ED25519: 1,
};

function calculateKeys(keyId: string, playerData: { [key: string]: bigint }, algo: Algorithm): [string, string] {
  // @ts-ignore
  const algoIndex = Algorithm[algo as keyof typeof Algorithm];
  let prvKey = BigInt(0);
  let pubKey: bigint | string = BigInt(-1);
  if (algoIndex === Algorithm.MPC_ECDSA_SECP256K1) {
    for (const playerId of Object.keys(playerData)) {
      prvKey =
        (prvKey + playerData[playerId] * _lagrangeCoefficient(playerId, Object.keys(playerData), secp256k1.CURVE.n)) %
        secp256k1.CURVE.n;
    }
    // @ts-ignore
    pubKey = secp256k1.ProjectivePoint.BASE.multiply(prvKey).toHex();
  } else if (algoIndex === Algorithm.MPC_EDDSA_ED25519) {
    for (const playerId of Object.keys(playerData)) {
      prvKey =
        (prvKey + playerData[playerId] * _lagrangeCoefficient(playerId, Object.keys(playerData), ed25519.CURVE.n)) %
        ed25519.CURVE.n;
    }
    // @ts-ignore
    pubKey = ed25519.ExtendedPoint.BASE.multiply(prvKey).toHex();
  } else if (algoIndex === Algorithm.MPC_CMP_ECDSA_SECP256K1) {
    for (const playerId of Object.keys(playerData)) {
      prvKey = (prvKey + playerData[playerId]) % secp256k1.CURVE.n;
    }
    // @ts-ignore
    pubKey = secp256k1.ProjectivePoint.BASE.multiply(prvKey).toHex();
  } else if (algoIndex === Algorithm.MPC_CMP_EDDSA_ED25519) {
    for (const playerId of Object.keys(playerData)) {
      prvKey = (prvKey + playerData[playerId]) % ed25519.CURVE.n;
    }
    // @ts-ignore
    pubKey = ed25519.ExtendedPoint.BASE.multiply(prvKey).toHex();
  } else {
    throw new UnknownAlgorithmError();
  }

  return [prvKey.toString(16).replace('0x', ''), pubKey as string];
}

function getPlayerId(keyId: string, deviceId: string, isCloud: boolean): bigint {
  let playerId;
  if (isCloud) {
    const keyIdFirstDword = _uuidToBuffer(keyId).subarray(0, 4);
    playerId = (BigInt(deviceId) << BigInt(32)) | BigInt((struct.unpack('I', keyIdFirstDword)[0] as Long).toString());
  } else {
    const cosignerPrefix = _uuidToBuffer(deviceId).subarray(0, 6).reverse();
    playerId = BigInt(struct.unpack('Q', Buffer.concat([cosignerPrefix, struct.pack('h', 0)]))[0].toString());
  }
  return playerId;
}

function decryptMobilePrivateKey(pass: string, userId: string, encryptedKey: Buffer): Buffer {
  const wrappedKey = forge.pkcs5.pbkdf2(pass, userId, 10000, 32, 'sha1');
  const decipher = forge.cipher.createDecipher('AES-CBC', forge.util.createBuffer(Buffer.from(wrappedKey, 'binary')));
  decipher.start({ iv: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] });
  decipher.update(forge.util.createBuffer(encryptedKey));
  decipher.finish();
  const decryptedBytes = Buffer.from(decipher.output.toHex(), 'hex');
  if (decryptedBytes.length === 48) {
    const unpaddedData = _unpad(decryptedBytes);
    return unpaddedData;
  }
  return decryptedBytes;
}

function _unpad(text: Buffer, k = 16): Buffer {
  const nl = text.length;
  const val = text[nl - 1];
  if (val > k) {
    throw new Error('Input is not padded or padding is corrupt');
  }
  if (!text.subarray(nl - val, nl).every((x) => x === val)) {
    throw new Error('Input is not padded or padding is corrupt');
  }
  const l_idx = nl - val;
  return text.subarray(0, l_idx);
}

function _lagrangeCoefficient(myId: string, allIds: string[], field: bigint) {
  function _primeModInverse(x: bigint, p: bigint): bigint {
    return modPow(x, p - BigInt(2), p);
  }

  let coefficient = BigInt(1);
  for (const id of allIds) {
    if (id === myId) {
      continue;
    }

    let tmp = _primeModInverse((BigInt(id) - BigInt(myId)) % field, field);
    tmp = (tmp * BigInt(id)) % field;
    coefficient *= tmp;
  }
  return coefficient;
}

function _uuidToBuffer(uuid: string): Buffer {
  return Buffer.from(uuid.replace('uuid:', '').replace('urn:', '').replace('-', ''), 'hex');
}

function _encodeKey(key: string, algo: Algorithm, chainCode: Buffer, isPub: boolean): string {
  // @ts-ignore
  const algoIndex = Algorithm[algo as keyof typeof Algorithm];
  const buffers = [];
  const keyBuffer = isPub
    ? Buffer.from(key.length === 66 ? key : '0'.repeat(66 - key.length) + key, 'hex')
    : Buffer.from(key.length === 64 ? key : '0'.repeat(64 - key.length) + key, 'hex');
  const isECDSA = algoIndex === Algorithm.MPC_ECDSA_SECP256K1 || algoIndex === Algorithm.MPC_CMP_ECDSA_SECP256K1;
  if (isPub) {
    buffers.push(Buffer.from(isECDSA ? '0488B21E' : '03273e4b', 'hex'));
  } else {
    buffers.push(Buffer.from(isECDSA ? '0488ADE4' : '03273a10', 'hex'));
  }
  buffers.push(Buffer.from('000000000000000000', 'hex'));
  buffers.push(chainCode);
  if (!isPub) {
    buffers.push(Buffer.from('00', 'hex'));
  }
  buffers.push(keyBuffer);
  return encode_b58check(Buffer.concat(buffers));
}

async function recoverAutoGeneratedPassphrase(params: KeyRecoveryConfig, agpFile: IZipEntry): Promise<string> {
  if ('mobileRsaPath' in params || 'mobileRsaBase64' in params) {
    let rsaFileData: string;
    if (params.mobileRsaPass) {
      if ('mobileRsaPath' in params) {
        rsaFileData = Buffer.from(fs.readFileSync(path.resolve(params.mobileRsaPath!), 'utf-8')).toString('base64');
      } else if ('mobileRsaBase64' in params) {
        rsaFileData = params.mobileRsaBase64!;
      } else {
        throw Error('RSA file path or base64 content is missing');
      }
    } else if ('mobileRsaPath' in params) {
      rsaFileData = Buffer.from(fs.readFileSync(path.resolve(params.mobileRsaPath!), 'utf-8')).toString('base64');
    } else if ('mobileRsaBase64' in params) {
      rsaFileData = params.mobileRsaBase64!;
    } else {
      throw Error('RSA file path or base64 content is missing');
    }

    const encryptedPassphrase: string = Buffer.from(
      (JSON.parse(agpFile.getData().toString()) as MobileKeyShare).encryptedKey,
      'hex',
    ).toString('binary');

    const privateKey = forge.pki.decryptRsaPrivateKey(rsaFileData, params.rsaPass);
    const decrypted = Buffer.from(
      // @ts-ignore
      privateKey.decrypt(encryptedPassphrase, 'RSA-OAEP'),
      {
        md: forge.md.sha256.create(),
        mgf1: {
          md: forge.md.sha256.create(),
        },
      },
      'binary',
    ).toString('hex');
    return decrypted;
  }
  throw new Error('Trying to recover autogenerated passphrase but no RSA details provided');
}

export async function recoverKeys(params: KeyRecoveryConfig): Promise<RecoveredKeys> {
  const keyMetadataMapping: { [key: string]: FinalizedMetadataKey } = {};
  const playerData: { [key: string]: { [key: string]: bigint } } = {};
  const zipData: Buffer =
    'zipBase64' in params ? Buffer.from(params.zipBase64, 'base64') : fs.readFileSync(path.resolve(params.zipPath));
  const rsaFileData: string =
    'rsaBase64' in params
      ? Buffer.from(params.rsaBase64, 'base64').toString()
      : fs.readFileSync(path.resolve(params.rsaPath), 'utf-8');
  const autoGeneratedPassphrase = !('mobilePass' in params);
  try {
    new AdmZip(zipData);
  } catch (e) {
    throw new InvalidRecoveryKitError();
  }
  const zip: AdmZip = new AdmZip(zipData);
  const zipFiles: IZipEntry[] = zip.getEntries();
  let metadataFile: IZipEntry | undefined;
  let agpFile: IZipEntry | undefined;
  for (const file of zipFiles) {
    if (file.entryName === 'metadata.json') {
      metadataFile = file;
      if (!autoGeneratedPassphrase || (autoGeneratedPassphrase && agpFile)) {
        break;
      }
    }
    if (autoGeneratedPassphrase && file.entryName === 'RSA_PASSPHRASE') {
      agpFile = file;
    }
  }

  if (!metadataFile) {
    throw new NoMetadataError();
  }
  if (autoGeneratedPassphrase && !agpFile) {
    throw new NoRSAPassphraseError();
  }

  const mobilePass = 'mobilePass' in params ? params.mobilePass! : await recoverAutoGeneratedPassphrase(params, agpFile!);
  const metadata: KeyShareMetadata = JSON.parse(metadataFile.getData().toString()) as KeyShareMetadata;
  const chainCode: Buffer = Buffer.from(metadata.chainCode, 'hex');
  let backupKeys: { [key: string]: MetadataKey } = {};
  if (metadata.keys) {
    backupKeys = metadata.keys!;
  } else {
    // Backwards compatibility - backup includes just one ECDSA key
    backupKeys = {
      [metadata.keyId!]: {
        publicKey: metadata.publicKey!,
        algo: 'MPC_ECDSA_SECP256K1' as unknown as Algorithm,
      },
    };
  }

  for (const key in backupKeys) {
    const metadataPublicKey = backupKeys[key].publicKey;
    const metadataAlgo = backupKeys[key].algo;
    let metadataChainCode: Buffer;
    if (backupKeys[key].chainCode) {
      metadataChainCode = Buffer.from(backupKeys[key].chainCode!, 'hex');
    } else {
      metadataChainCode = Buffer.from(chainCode); // Copy of chaincode.
    }

    if (metadataChainCode.length !== 32) {
      throw new UnknownChainCodeError();
    }

    keyMetadataMapping[key] = {
      publicKey: metadataPublicKey,
      chainCode: metadataChainCode,
      algo: metadataAlgo,
    };
  }

  for (const file of zipFiles) {
    if (file.entryName.startsWith('MOBILE')) {
      const keyShare = JSON.parse(file.getData().toString()) as MobileKeyShare;
      const { keyId } = keyShare;
      let decryptedKey: Buffer;
      if (!Object.keys(keyMetadataMapping).includes(keyId)) {
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
        if (algorithmMapping[keyMetadataMapping[keyId].algo.toString() as string] !== algoId) {
          throw new UnknownAlgorithmError();
        }
        decryptedKey = decryptedKey.subarray(0, 4);
      }
      if (playerData[keyId] === undefined) {
        playerData[keyId] = {};
      }
      playerData[keyId][getPlayerId(keyId, keyShare.deviceId, false).toString()] = BigInt(`0x${decryptedKey.toString('hex')}`);
    } else if (['metadata.json', 'RSA_PASSPHRASE'].includes(file.entryName)) {
      continue;
    } else {
      let cosigner: string;
      let keyId: string | undefined;
      if (file.entryName.includes('_')) {
        [cosigner, keyId] = file.entryName.split('_');
      } else {
        // Backwards compatability - backup includes just one ECDSA key
        if (Object.keys(keyMetadataMapping).length === 1) {
          cosigner = file.entryName;
          keyId = Object.keys(keyMetadataMapping)[0];
        } else {
          keyId = undefined;
        }
      }

      if (keyId) {
        let privateKey;
        let data;
        try {
          data = file.getData().toString('binary');
          privateKey = forge.pki.decryptRsaPrivateKey(rsaFileData, params.rsaPass);
        } catch (e) {
          throw new DecryptRSAPrivateKeyError();
        }

        if (privateKey === null) {
          throw new InvalidRSAPrivateKeyError();
        }

        let decrypted;
        try {
          // @ts-ignore
          decrypted = Buffer.from(privateKey.decrypt(data, 'RSA-OAEP'), 'binary').toString('hex');
        } catch (e) {
          throw new InvalidRecoveryKitError();
        }

        const playerId = getPlayerId(keyId, cosigner!, true).toString();
        if (playerData[keyId] === undefined) {
          playerData[keyId] = {};
        }
        playerData[keyId][playerId] = BigInt(`0x${decrypted}`);
      }
    }
  }

  for (const keyId in keyMetadataMapping) {
    if (!Object.keys(playerData).includes(keyId)) {
      throw new KeyIdMissingError(keyId);
    }
  }

  const prvKeys: CalculatedPrivateKey = {};

  for (const keyId of Object.keys(playerData)) {
    const playerDataForKey = playerData[keyId];
    const { algo } = keyMetadataMapping[keyId];
    const { chainCode } = keyMetadataMapping[keyId];
    let [prvKey, pubKey] = calculateKeys(keyId, playerDataForKey, algo);
    const pubFromMetadata = keyMetadataMapping[keyId].publicKey;
    if (pubFromMetadata !== pubKey) {
      // eslint-disable-next-line no-console
      console.error(
        `Failed to recover ${algo} key. Expected public key is ${pubFromMetadata} got: ${BigInt(`0x${pubKey}`).toString(16)}.`,
      );
      prvKey = '';
    } else {
      // @ts-ignore
      const algoIndex = Algorithm[algo as keyof typeof Algorithm];
      if (Object.keys(prvKey).includes(Algorithm[algoIndex])) {
        continue;
      } else {
        prvKeys[algoIndex] = {
          prvKey: _encodeKey(prvKey, algo, chainCode, false),
          pubKey: _encodeKey(pubKey, algo, chainCode, true),
          chainCode: chainCode.toString('hex'),
        };
      }
    }
  }

  const prvKeyIdxs = Object.keys(prvKeys);
  let ecdsaIdx: string;
  let eddsaIdx: string;
  if (prvKeyIdxs.includes('0') || prvKeyIdxs.includes('2')) {
    ecdsaIdx = prvKeyIdxs.includes('0') ? '0' : '2';
  }
  if (prvKeyIdxs.includes('1') || prvKeyIdxs.includes('3')) {
    eddsaIdx = prvKeyIdxs.includes('1') ? '1' : '3';
  }

  const keys = {
    xpub: prvKeys[ecdsaIdx!].pubKey,
    xprv: prvKeys[ecdsaIdx!] ? prvKeys[ecdsaIdx!].prvKey : undefined,
    chainCodeEcdsa: prvKeys[ecdsaIdx!].chainCode ?? undefined,
  } as RecoveredKeys;

  if (prvKeys[eddsaIdx!]) {
    keys.fpub = prvKeys[eddsaIdx!].pubKey;
    keys.fprv = prvKeys[eddsaIdx!].prvKey ?? undefined;
    keys.chainCodeEddsa = prvKeys[eddsaIdx!].chainCode ?? undefined;
  }

  if (!params.recoveryPrv) {
    delete keys.xprv;
    delete keys.fprv;
  }
  return keys;
}
