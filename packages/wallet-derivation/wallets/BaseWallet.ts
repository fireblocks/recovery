import { getLogger } from '@fireblocks/recovery-shared';
import { LOGGER_NAME_RELAY, LOGGER_NAME_SHARED, LOGGER_NAME_UTILITY } from '@fireblocks/recovery-shared/constants';
import { RecoveredKey } from '@fireblocks/extended-key-recovery/src/types';
import { Algorithm, HDPath, HDPathParts, Input, KeyDerivation, Derivation } from '../types';

export abstract class BaseWallet implements Derivation {
  /** Asset ID */
  public assetId: string;

  /** Signature algorithm */
  public algorithm: 'ECDSA' | 'EDDSA';

  /** BIP44 path */
  public path: HDPath;

  /** BIP44 path parts */
  public pathParts: HDPathParts;

  /** Encoded address */
  public address: string;

  /** Memo/destination tag */
  public tag?: string;

  /** Address type */
  public type: 'Deposit' | 'Permanent';

  /** Address description */
  public description?: string;

  /** Derived public key hexadecimal string */
  public publicKey: string;

  /** Derived private key hexadecimal string */
  public privateKey?: string;

  /** Derived private key in Wallet Import Format (ECDSA) */
  public wif?: string;

  /** Is testnet asset */
  public isTestnet: boolean;

  /** Is legacy derivation (vs. Segwit) */
  public isLegacy: boolean;

  public relayLogger = getLogger(LOGGER_NAME_RELAY);

  public utilityLogger = getLogger(LOGGER_NAME_UTILITY);

  public sharedLogger = getLogger(LOGGER_NAME_SHARED);

  constructor(input: Input, defaultCoinType: number, algorithm: Algorithm) {
    this.assetId = input.assetId;
    this.algorithm = algorithm;
    this.isLegacy = input.isLegacy ?? false;
    this.isTestnet = input.isTestnet ?? false;

    this.path = {
      coinType: input.path.coinType ?? (this.isTestnet ? 1 : defaultCoinType),
      account: input.path.account ?? 0,
      changeIndex: input.path.changeIndex ?? 0,
      addressIndex: input.path.addressIndex ?? 0,
    };

    this.pathParts = [44, this.path.coinType, this.path.account, this.path.changeIndex, this.path.addressIndex];

    this.type = this.path.addressIndex > 0 ? 'Deposit' : 'Permanent';

    const isEdDSA = algorithm === 'EDDSA';

    let key;

    if ('xpub' in input) {
      // Only in relay
      const { xpub, fpub } = input;
      key = { xprv: undefined, fprv: undefined, xpub, fpub };
    } else {
      const keysetWithRecoveredKey = Object.entries(input)
        .filter(([keysetId]) => !['ncwMaster', 'assetId', 'path', 'isTestnet', 'isLegacy'].includes(keysetId))
        .sort(([keysetId1], [keysetId2]) => Number(keysetId1) - Number(keysetId2))
        .findLast(([, value]) => {
          const recoveredKey = value as RecoveredKey;
          if (isEdDSA && recoveredKey.eddsaExists) {
            return recoveredKey.eddsaMinAccount !== -1 && recoveredKey.eddsaMinAccount <= this.path.account;
          }
          if (!isEdDSA && recoveredKey.ecdsaExists) {
            return recoveredKey.ecdsaMinAccount !== -1 && recoveredKey.ecdsaMinAccount <= this.path.account;
          }

          return false;
        }) as [string, RecoveredKey | undefined];
      if (keysetWithRecoveredKey[1] === undefined) {
        // This should technically never happen
        throw new Error('No keysets defined for minimal account');
      }
      const { xprv, fprv, xpub, fpub } = keysetWithRecoveredKey[1];
      key = { xprv, fprv, xpub, fpub };
    }

    const isXprvDerivation = typeof key.xprv === 'string' || typeof key.fprv === 'string';

    const xprvKey = isEdDSA ? 'fprv' : 'xprv';

    const xpubKey = isEdDSA ? 'fpub' : 'xpub';

    const extendedKey = isXprvDerivation ? key[xprvKey] : key[xpubKey];

    if (!extendedKey) {
      throw new Error(`${algorithm} extended key is required (${xprvKey} or ${xpubKey})`);
    }

    const { publicKey, evmAddress, privateKey, wif } = this.derive(extendedKey);

    this.publicKey = publicKey;

    if (isXprvDerivation) {
      this.privateKey = privateKey;
      this.wif = wif;
    }

    this.address = this.getAddress(evmAddress);
  }

  protected abstract derive(extendedKey: string): KeyDerivation;

  protected abstract getAddress(evmAddress?: string): string;

  public isLateInit(): boolean {
    return false;
  }
}
