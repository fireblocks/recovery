import { WalletMaster } from '@fireblocks/extended-key-recovery';
import { sha256 } from '@noble/hashes/sha256';
import { hmac } from '@noble/hashes/hmac';
import { sha512 } from '@noble/hashes/sha512';
import { secp256k1 } from '@noble/curves/secp256k1';
import { ed25519 } from '@noble/curves/ed25519';
import { NCWalletShare } from '../types';

type NCWAlgorithm = 'MPC_ECDSA_SECP256K1' | 'MPC_EDDSA_ED25519';

const ALGORITHM_CURVE_ORDER: Record<NCWAlgorithm, bigint> = {
  MPC_ECDSA_SECP256K1: secp256k1.CURVE.n,
  MPC_EDDSA_ED25519: ed25519.CURVE.n,
};

const ALGORITHM_SHARE_KEY: Record<NCWAlgorithm, string> = {
  MPC_ECDSA_SECP256K1: 'MPC_CMP_ECDSA_SECP256K1',
  MPC_EDDSA_ED25519: 'MPC_CMP_EDDSA_ED25519',
};

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

  public derivePrivateKey(walletId: string, algorithm: NCWAlgorithm): NCWalletShare {
    this.assertValidWalletId(walletId);
    const targetOrder = ALGORITHM_CURVE_ORDER[algorithm];
    if (!targetOrder) {
      throw new Error(`Unsupported algorithm: ${algorithm}`);
    }

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

      // BIP-32 hardened child derivation — always on secp256k1 regardless of target algorithm
      const derivedX = ((base + offset) % secp256k1.CURVE.n).toString(16);
      const derived = Buffer.from(`${'0'.repeat(64 - derivedX.length)}${derivedX}`, 'hex');

      // SHA-512 expansion, reduced directly mod the target curve order
      const expansionBuf = sha512.create().update(derived).digest();
      const walletShare = BigInt(`0x${Buffer.from(expansionBuf).toString('hex')}`) % targetOrder;

      const hex = walletShare.toString(16);
      result[cosignerId] = hex.padStart(64, '0');
    });

    const shareKey = ALGORITHM_SHARE_KEY[algorithm];
    return {
      chainCode: this.deriveAssetChainCode(walletId),
      shares: Object.entries(result).map(([cosigner, share]) => ({ cosigner, [shareKey]: share })),
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
