import { sha256, encodeBase58, HDNodeWallet } from 'ethers';
import { Input, KeyDerivation } from '../types';
import { BaseWallet } from './BaseWallet';

export abstract class ECDSAWallet extends BaseWallet {
  constructor(input: Input, defaultCoinType: number) {
    super(input, defaultCoinType, 'ECDSA');
  }

  private static getWif(privateKey: string) {
    if (!privateKey) {
      return undefined;
    }

    const fullPrivateKey = `0x80${privateKey.slice(2)}01`;
    const firstHash = sha256(fullPrivateKey);
    const secondHash = sha256(firstHash);
    const checksum = secondHash.slice(2, 10);
    const wifHex = `${fullPrivateKey}${checksum}`;
    const wifBase58 = encodeBase58(wifHex);
    return wifBase58;
  }

  protected derive(extendedKey: string): KeyDerivation {
    const pathString = `m/${this.pathParts.join('/')}`;

    const derivedWallet = HDNodeWallet.fromExtendedKey(extendedKey).derivePath(pathString);

    const { address: evmAddress, publicKey } = derivedWallet;

    const privateKey = 'privateKey' in derivedWallet ? derivedWallet.privateKey : undefined;

    const wif = privateKey ? ECDSAWallet.getWif(privateKey) : undefined;

    this.sharedLogger.info('Derived ECDSA wallet', { publicKey, evmAddress });

    return {
      evmAddress,
      publicKey,
      privateKey,
      wif,
    };
  }
}
