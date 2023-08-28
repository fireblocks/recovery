import { MasterkeyMetadata, RecoveryPackageMetadata, SigningKeyMetadata, UnknownChainCodeError } from './types';

export const parseMetadataFile = (metadataFile: string): RecoveryPackageMetadata => {
  const metadataObj = JSON.parse(metadataFile);
  const defaultChainCode = Buffer.from(metadataObj.chainCode, 'hex');

  const signingKeys: { [key: string]: SigningKeyMetadata } = {};
  const masterKeys: { [key: string]: MasterkeyMetadata } = {};

  let keysInKit: { [key: string]: SigningKeyMetadata } = {};
  if (!metadataObj.keys) {
    keysInKit = {
      [metadataObj.keyId]: {
        publicKey: metadataObj.publicKey,
        algo: 'MPC_ECDSA_SECP256K1',
      },
    };
  } else {
    for (const key in metadataObj.keys) {
      keysInKit[key] = metadataObj.keys[key];
    }
  }

  for (const key in keysInKit) {
    const metadataPublicKey = keysInKit[key].publicKey;
    const metadataAlgo = keysInKit[key].algo;
    let metadataChainCode: Buffer;
    if (keysInKit[key].chainCode) {
      if (typeof keysInKit[key].chainCode === 'string') {
        metadataChainCode = Buffer.from(keysInKit[key].chainCode! as string, 'hex');
      } else {
        metadataChainCode = keysInKit[key].chainCode! as Buffer;
      }
    } else {
      metadataChainCode = Buffer.from(defaultChainCode); // Copy of chaincode.
    }

    if (metadataChainCode.length !== 32) {
      throw new UnknownChainCodeError();
    }

    signingKeys[key] = {
      publicKey: metadataPublicKey,
      chainCode: metadataChainCode,
      algo: metadataAlgo,
    };
  }

  if (!metadataObj.masterKeys) {
    return {
      signingKeys,
      masterKeys: {},
    };
  }

  const masterKeysInKit: { [key: string]: MasterkeyMetadata } = metadataObj.masterKeys;
  for (const key in masterKeysInKit) {
    const keyMetadata = masterKeysInKit[key];
    const keyType = keyMetadata.type;
    let walletSeed: Buffer, assetSeed: Buffer;
    if (typeof keyMetadata.walletSeed === 'string') {
      walletSeed = Buffer.from(keyMetadata.walletSeed, 'hex');
    } else {
      walletSeed = keyMetadata.walletSeed as Buffer;
    }
    if (typeof keyMetadata.assetSeed === 'string') {
      assetSeed = Buffer.from(keyMetadata.assetSeed, 'hex');
    } else {
      assetSeed = keyMetadata.assetSeed as Buffer;
    }
    const cosigners = keyMetadata.cosigners;

    masterKeys[key] = {
      type: keyType,
      walletSeed,
      assetSeed,
      cosigners,
    };
  }

  return {
    signingKeys,
    masterKeys,
  };
};
