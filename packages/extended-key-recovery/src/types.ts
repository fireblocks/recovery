// eslint-disable-next-line max-classes-per-file
import { Algorithm } from './algorithms';

export type CosignerType = 'cloud' | 'mobile';

// export type Algorithm = 'MPC_ECDSA_SECP256K1' | 'MPC_EDDSA_ED25519' | 'MPC_CMP_ECDSA_SECP256K1' | 'MPC_CMP_EDDSA_ED25519';

export type CosignerMetadata = {
  id: string;
  type: CosignerType;
};

export type BaseMetadataKey = {
  publicKey: string;
  algo: Algorithm;
};

export type SigningKeyMetadata = BaseMetadataKey & {
  chainCode?: Uint8Array;
  keysetId: number;
};

export type NCWWalletMasterMetadata = {
  type: string;
  walletSeed: Uint8Array | string;
  assetSeed: Uint8Array | string;
  cosigners: CosignerMetadata[];
};

export type WalletMaster = {
  walletSeed: string;
  assetSeed: string;
  masterKeyForCosigner: { [key: string]: string };
};

export class NoMetadataError extends Error {
  constructor() {
    super('No metdata.json file found in key share zip');
  }
}

export class NoRSAPassphraseError extends Error {
  constructor() {
    super('Specified auto-generated passphrase but no corresponding file found in key share zip');
  }
}

export class UnknownChainCodeError extends Error {
  constructor() {
    super('Chain code is metadata.json is missing or invalid');
  }
}

export class KeyIdNotInMetadata extends Error {
  constructor() {
    super('Key Id found in zip file but does not exist in metadata.json');
  }
}

export class DecryptMobileKeyError extends Error {
  constructor() {
    super('Mobile key decryption error - make sure mobile key passphrase is correct');
  }
}

export class DecryptRSAPrivateKeyError extends Error {
  constructor() {
    super('RSA Private key decryption error - make sure the RSA passphrase is correct');
  }
}

export class InvalidRSAPrivateKeyError extends Error {
  constructor() {
    super('Failed getting RSA private key - make sure the RSA passphrase is correct');
  }
}

export class InvalidRecoveryKitError extends Error {
  constructor() {
    super(
      'Failed obtaining data from the recovery kit - make sure you use the correct (and uncorrupted) recovery kit and RSA key',
    );
  }
}

export class UnknownAlgorithmError extends Error {
  constructor() {
    super('metadata.json contains unsupported signature algorithm');
  }
}

export class KeyIdMissingError extends Error {
  constructor(keyId: string) {
    super(`metadata.json contains key id ${keyId}, which wasn't found in zip file`);
  }
}

export class MissingWalletMasterKeyId extends Error {
  constructor() {
    super('metadata.json does not contain any non custodial wallet master keys');
  }
}

export class AmbiguousWalletMasterKeyId extends Error {
  constructor() {
    super('metadata.json contains more than one non custodial wallet master keys');
  }
}

export class DuplicateMasterKeyFile extends Error {
  constructor() {
    super('Duplicate master key file found in kit');
  }
}

export class MissingMasterKeyFile extends Error {
  constructor() {
    super('Missing master key file in kit');
  }
}

export class InvalidMasterKey extends Error {
  constructor() {
    super('Invalid master key');
  }
}

export type PlayerData = { [keyId: string]: { [playerId: string]: bigint } };

export type MobileKeyShare = {
  encryptedKey: string;
  keyId: string;
  deviceId: string;
  userId: string;
  encryptionAlgorithm: string;
};

export type RecoveredKey = {
  xpub?: string;
  fpub?: string;
  xprv?: string;
  fprv?: string;
  chainCodeEcdsa?: string;
  chainCodeEddsa?: string;
  ecdsaExists: boolean;
  eddsaExists: boolean;
  ecdsaMinAccount: number;
  eddsaMinAccount: number;
};

export type RecoveredKeys = {
  [keyset: number]: RecoveredKey;
  ncwWalletMaster?: WalletMaster;
};

export type CalculatedPrivateKeysets = {
  [keysetId: number]: {
    [algo in Algorithm]?: {
      prvKey: string;
      pubKey: string;
      chainCode: string;
    };
  };
};

export type KeyRecoveryConfig = {
  /**
   * The rsa file passphrase
   */
  rsaPass: string;

  /**
   * Recover private keys too
   */
  recoveryPrv: boolean;

  /**
   * Should only recover NCW wallet
   */
  recoverOnlyNCW: boolean;
} & (
  | {
      /**
       * The zip file containing all the key share details
       */
      zipPath: string;
      /**
       * The rsa file used to encrypt the key share details
       */
      rsaPath: string;
    }
  | {
      /**
       * The zip file containing all the key shares in base64 (the entire file)
       */
      zipBase64: string;

      /**
       * The rsa file used to encrypt the key share in base64 (the entire file)
       */
      rsaBase64: string;
    }
) &
  (
    | {
        /**
         * The mobile keyshare passphrase
         */
        mobilePass?: string;
      }
    | ((
        | {
            /**
             * The mobile RSA key path for auto generated passphrases
             */
            mobileRsaPath?: string;
          }
        | {
            /**
             * The mobile RSA key in base64.
             */
            mobileRsaBase64?: string;
          }
      ) & {
        /**
         * The mobile RSA key passphrase
         */
        mobileRsaPass?: string;
      })
  );
