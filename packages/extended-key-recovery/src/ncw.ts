/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
import forge from 'node-forge';
import { IZipEntry } from 'adm-zip';
import { _uuidToBuffer } from './players';
import {
  AmbiguousWalletMasterKeyId,
  DecryptRSAPrivateKeyError,
  DuplicateMasterKeyFile,
  InvalidMasterKey,
  WalletMaster,
  NCWWalletMasterMetadata,
  MissingMasterKeyFile,
  MissingWalletMasterKeyId,
} from './types';

const _getCloudPlayerId = (cosignerId: string) => {
  const prefix = _uuidToBuffer(cosignerId).subarray(0, 4).readUint32LE();
  return prefix;
};

export const recoverNCWMaster = (
  zipFiles: IZipEntry[],
  rsaPrivateKey: forge.pki.rsa.PrivateKey,
  masterKeys: { [key: string]: NCWWalletMasterMetadata },
): WalletMaster => {
  const walletMasterKeyId = Object.keys(masterKeys)
    .map((key) => (masterKeys[key].type === 'NON_CUSTODIAL_WALLET_MASTER' ? key : undefined))
    .filter((key) => key !== undefined);

  if (walletMasterKeyId.length === 0) {
    throw new MissingWalletMasterKeyId();
  } else if (walletMasterKeyId.length > 1) {
    throw new AmbiguousWalletMasterKeyId();
  }

  const keyId = walletMasterKeyId[0]!;
  const { walletSeed } = masterKeys[keyId];
  const { assetSeed } = masterKeys[keyId];

  const cosignerKeys: { [key: string]: string } = {};
  for (const cosigner of masterKeys[keyId].cosigners) {
    if (cosigner.type !== 'cloud') {
      continue;
    }

    const playerId = _getCloudPlayerId(cosigner.id);
    const fileName = `${playerId}_${keyId}`;
    const files = zipFiles.filter((file) => file.entryName === fileName);
    if (files.length === 0) {
      throw new MissingMasterKeyFile();
    } else if (files.length > 1) {
      throw new DuplicateMasterKeyFile();
    }

    let masterKey: Buffer;
    try {
      masterKey = Buffer.from(rsaPrivateKey.decrypt(files[0].getData().toString('binary'), 'RSA-OAEP'), 'binary');
    } catch (e) {
      throw new DecryptRSAPrivateKeyError();
    }

    if (masterKey.length !== 32) {
      throw new InvalidMasterKey();
    }

    cosignerKeys[cosigner.id] = masterKey.toString('hex');
  }

  return {
    assetSeed: (assetSeed as unknown as Buffer).toString('hex'),
    walletSeed: (walletSeed as unknown as Buffer).toString('hex'),
    masterKeyForCosigner: cosignerKeys,
  };
};
