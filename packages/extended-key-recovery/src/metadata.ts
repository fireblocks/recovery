/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
import { Algorithm, getAlgorithmFromString } from './algorithms';
import { NCWWalletMasterMetadata, SigningKeyMetadata, UnknownChainCodeError } from './types';

export type RecoveryPackageMetadata = {
  signingKeys: SigningKeysMap;
  ncwWalletMasters?: NCWWalletMastersMap;
  keysetThMapping: KeysetThresholdMap;
  maxKeysetId: number;
};

export type SigningKeysMap = { [key: string]: SigningKeyMetadata };
export type NCWWalletMastersMap = { [key: string]: NCWWalletMasterMetadata };
export type KeysetThresholdMap = { [key in Algorithm]?: { [keyset: number]: number } };

type RecoveryKitMetadata = {
  chainCode: string;
  tenantId: string;
  keys?: RecoveryKitKeyShardDefinitions; // Old format only has keyId
  processId?: string;
  keysetMapping?: KeysetThresholdDefinition[];

  // Old format:
  keyId?: string;
  publicKey?: string;

  // NCW
  masterKeys?: NCWMasterKeyDefinitions;
};

type NCWMasterKeyDefinitions = {
  [keyId: string]: NCWWalletMasterMetadata;
};

type RecoveryKitKeyShardDefinitions = {
  [keyId: string]: RecoveryKitKeyShardsEntry;
};

type RecoveryKitKeyShardsEntry = {
  publicKey: string;
  keysetId?: number;
  chainCode?: string;
  algo: string;
  cosigners: RecoveryKitKeyCosignerEntry[];
};

type RecoveryKitKeyCosignerEntry = {
  id: string;
  cosignerType: string;
};

type KeysetThresholdDefinition = {
  keysetId: number;
  algo: string;
  minAccount: number;
};

const getKeysFromKit = (metadata: RecoveryKitMetadata): { [key: string]: SigningKeyMetadata } => {
  let keys: { [key: string]: SigningKeyMetadata } = {};
  if (!metadata.keys) {
    keys = {
      [metadata.keyId!]: {
        publicKey: metadata.publicKey!,
        algo: 'MPC_ECDSA_SECP256K1',
        keysetId: 1,
      },
    };
  } else {
    for (const [key, entry] of Object.entries(metadata.keys)) {
      keys[key] = {
        publicKey: entry.publicKey,
        chainCode: Uint8Array.from(Buffer.from(entry.chainCode ?? metadata.chainCode, 'hex')),
        algo: getAlgorithmFromString(entry.algo),
        keysetId: entry.keysetId ?? 1,
      };
    }
  }

  return keys;
};

const getKeysetThresholdMap = (metadata: RecoveryKitMetadata): KeysetThresholdMap => {
  const keysetMap: KeysetThresholdMap = {};

  if (metadata.keysetMapping) {
    for (const thMap of metadata.keysetMapping) {
      const { algo: algoStr, keysetId, minAccount } = thMap;
      const algo = getAlgorithmFromString(algoStr);
      if (!keysetMap[algo]) {
        keysetMap[algo] = {};
      }
      keysetMap[algo]![keysetId] = minAccount;
    }
  } else {
    // Set a default - all keys from keyset 1
    keysetMap.MPC_ECDSA_SECP256K1 = { 1: 0 };
    keysetMap.MPC_EDDSA_ED25519 = { 1: 0 };
  }

  return keysetMap;
};

export const parseMetadataFile = (metadataFile: string): RecoveryPackageMetadata => {
  const metadata = JSON.parse(metadataFile) as RecoveryKitMetadata;
  const defaultChainCode = Buffer.from(metadata.chainCode, 'hex');

  const signingKeys: { [key: string]: SigningKeyMetadata } = {};
  const masterKeys: { [key: string]: NCWWalletMasterMetadata } = {};

  const keysInKit = getKeysFromKit(metadata);
  let maxKeysetId = 1;

  for (const key in keysInKit) {
    const { publicKey: metadataPublicKey, algo: metadataAlgo, keysetId } = keysInKit[key];
    let metadataChainCode: Buffer;
    if (keysInKit[key].chainCode) {
      if (typeof keysInKit[key].chainCode === 'string') {
        metadataChainCode = Buffer.from(keysInKit[key].chainCode! as unknown as string, 'hex');
      } else {
        metadataChainCode = keysInKit[key].chainCode! as unknown as Buffer;
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
      keysetId,
    };

    if (keysetId > maxKeysetId) {
      maxKeysetId = keysetId;
    }
  }

  const keysetThMapping = getKeysetThresholdMap(metadata);

  if (!metadata.masterKeys) {
    return {
      signingKeys,
      keysetThMapping,
      maxKeysetId,
    };
  }

  const masterKeysInKit: NCWWalletMastersMap = metadata.masterKeys;
  for (const key in masterKeysInKit) {
    const keyMetadata = masterKeysInKit[key];
    const keyType = keyMetadata.type;
    let walletSeed: Buffer;
    let assetSeed: Buffer;
    if (typeof keyMetadata.walletSeed === 'string') {
      walletSeed = Buffer.from(keyMetadata.walletSeed, 'hex');
    } else {
      walletSeed = keyMetadata.walletSeed as unknown as Buffer;
    }
    if (typeof keyMetadata.assetSeed === 'string') {
      assetSeed = Buffer.from(keyMetadata.assetSeed, 'hex');
    } else {
      assetSeed = keyMetadata.assetSeed as unknown as Buffer;
    }
    const { cosigners } = keyMetadata;

    masterKeys[key] = {
      type: keyType,
      walletSeed,
      assetSeed,
      cosigners,
    };
  }

  return {
    signingKeys,
    ncwWalletMasters: masterKeys,
    keysetThMapping,
    maxKeysetId,
  };
};
