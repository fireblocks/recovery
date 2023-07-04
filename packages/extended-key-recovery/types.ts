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
    super('Mobile key decryption error');
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

export type MobileKeyShare = {
  encryptedKey: string;
  keyId: string;
  deviceId: string;
  userId: string;
  encryptionAlgorithm: string;
};

export type KeyShareMetadata = {
  chainCode: string;
  tenantId: string;
  keys?: { [key: string]: MetadataKey };
  keyId?: string;
  publicKey?: string;
};

export type BaseMetadataKey = {
  publicKey: string;
  algo: Algorithm;
};

export type MetadataKey = BaseMetadataKey & { chainCode?: string };

export type FinalizedMetadataKey = BaseMetadataKey & { chainCode: Buffer };

export enum Algorithm {
  'MPC_ECDSA_SECP256K1',
  'MPC_EDDSA_ED25519',
  'MPC_CMP_ECDSA_SECP256K1',
  'MPC_CMP_EDDSA_ED25519',
}

export type RecoveredKeys = {
  xpub: string;
  fpub: string;
  xprv?: string;
  fprv?: string;
  chainCodeEcdsa?: string;
  chainCodeEddsa?: string;
};

export type CalculatedPrivateKey = {
  [key: string]: {
    prvKey: string;
    pubKey: string;
    chainCode: string;
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
