import { WalletMaster } from '@fireblocks/extended-key-recovery';
import { sha256 } from '@noble/hashes/sha256';
import { hmac } from '@noble/hashes/hmac';
import { sha512 } from '@noble/hashes/sha512';
import { secp256k1 } from '@noble/curves/secp256k1';
import { NCWalletShare } from '../types';

export class NCWallet {
  private derivationChildNum: Buffer;

  constructor(private walletMaster: WalletMaster) {
    this.derivationChildNum = Buffer.alloc(4);
    this.derivationChildNum.writeInt32BE(1 << 31);
  }

  private assertValidWalletId(walletId: string) {
    if (!/[A-Fa-f0-9]{8}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{12}$/g.test(walletId)) {
      throw new Error(`Invalid wallet ID, must be a UUID: ${walletId}`);
    }
  }

  algorithmToMod(algorithm: string): bigint {
    if (algorithm !== 'MPC_ECDSA_SECP256K1') {
      throw new Error(`Unsupported algorithm: ${algorithm}`);
    }

    return secp256k1.CURVE.n;
  }

  public derivePrivateKey(walletId: string, algorithm: string): NCWalletShare {
    this.assertValidWalletId(walletId);
    const mod = this.algorithmToMod(algorithm);
    const wallestSeedBuf: Buffer = Buffer.from(this.walletMaster.walletSeed, 'hex');

    const walletIdBuf = Buffer.from(walletId);

    const chainCode = sha256
      .create()
      .update(Buffer.concat([walletIdBuf, wallestSeedBuf]))
      .digest();

    const result: { [key: string]: string } = {};

    Object.entries(this.walletMaster.masterKeyForCosigner).forEach(([cosignerId, masterKey]) => {
      const masterKeyBuf = Buffer.from(masterKey, 'hex');
      if (masterKeyBuf.length !== 32) {
        throw new Error(`Master key length for cosigner ${cosignerId} is not 32 bytes`);
      }
      const offset = BigInt(
        `0x${Buffer.from(hmac(sha512, chainCode, Buffer.concat([Buffer.from([0x00]), masterKeyBuf, this.derivationChildNum])))
          .subarray(0, 32)
          .toString('hex')}`,
      );
      const base = BigInt(masterKey.startsWith('0x') ? masterKey : `0x${masterKey}`);

      const derivedX = ((base + offset) % secp256k1.CURVE.n).toString(16);
      const derived = Buffer.from(`${'0'.repeat(64 - derivedX.length)}${derivedX}`, 'hex');

      const expansionBuf = sha512.create().update(derived).digest();
      const expansion = BigInt(`0x${Buffer.from(expansionBuf).toString('hex')}`) % secp256k1.CURVE.n;

      const walletShare = expansion % mod;

      result[cosignerId] = walletShare.toString(16).replace('0x', '');
    });
    return {
      chainCode: this.deriveAssetChainCode(walletId),
      shares: Object.entries(result).map(([cosigner, share]) => ({ cosigner, MPC_CMP_ECDSA_SECP256K1: share })),
    };
  }

  public deriveAssetChainCode(walletId: string) {
    this.assertValidWalletId(walletId);
    return Buffer.from(
      sha256
        .create()
        .update(Buffer.concat([Buffer.from(walletId), Buffer.from(this.walletMaster.assetSeed, 'hex')]))
        .digest(),
    ).toString('hex');
  }
}
