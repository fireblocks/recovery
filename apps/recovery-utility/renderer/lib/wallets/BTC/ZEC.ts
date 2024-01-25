import { ZCash as BaseZEC } from '@fireblocks/wallet-derivation';
import { blake2b } from '@noble/hashes/blake2b';
import { decode as bs58decode } from 'bs58check';
import { initEccLib } from 'bitcoinjs-lib';
import * as tinysecp from 'tiny-secp256k1';
import { ECPairFactory } from 'ecpair';
import { SigningWallet } from '../SigningWallet';
import { GenerateTxInput, TxPayload, UTXO } from '../types';
import { BTCUtilitySigner } from './BTCUtilitySigner';

initEccLib(tinysecp);

type NetworkUpgradeConfiguration = {
  branchId: number;
  txVersion: number;
  versionGroupId: number;
  activationHeight: number;
};
type CustomBlakeHash = ReturnType<typeof blake2b.create> & { digestHex: () => Buffer };
const intBuffer: (size?: number) => Buffer = (size: number = 4) => Buffer.alloc(size);
const blakeHash: (p: string | Buffer) => CustomBlakeHash = (p: string | Buffer) => {
  const result = blake2b.create({
    personalization: p,
    dkLen: 32,
  }) as CustomBlakeHash;
  result.digestHex = () => Buffer.from(result.digest());
  return result;
};
const seqBuffer = Buffer.from([0xff, 0xff, 0xff, 0xff]);

export class ZCash extends BaseZEC implements SigningWallet {
  // https://github.com/zcash/librustzcash/blob/main/zcash_primitives/src/consensus.rs#L528 & https://github.com/zcash/librustzcash/blob/main/zcash_primitives/src/transaction/mod.rs#L44
  private readonly networkUpgradeConfigs: { [key: string]: NetworkUpgradeConfiguration } = {
    Sprout: { branchId: 0x0, txVersion: 2, versionGroupId: 0, activationHeight: 0 },
    Overwinter: { branchId: 0x5ba81b19, txVersion: 3, versionGroupId: 0x03c48270, activationHeight: 347_500 },
    Sapling: { branchId: 0x76b809bb, txVersion: 4, versionGroupId: 0x892f2085, activationHeight: 419_200 },
    Blossom: { branchId: 0x2bb40e60, txVersion: 4, versionGroupId: 0x892f2085, activationHeight: 653_600 },
    Heartwood: { branchId: 0xf5b9230b, txVersion: 4, versionGroupId: 0x892f2085, activationHeight: 903_000 },
    Canopy: { branchId: 0xe9ff75a6, txVersion: 4, versionGroupId: 0x892f2085, activationHeight: 1_046_400 },
    Nu5: { branchId: 0xc2d6d0b4, txVersion: 5, versionGroupId: 0x26a7270a, activationHeight: 1_687_104 },
    Nu6: { branchId: 0xc8e71055, txVersion: 5, versionGroupId: 0xffffffff, activationHeight: 0xffffffff }, // TODO: Fix this for Nu6 when applicable
  };

  private readonly SIGHASH_ALL = 0x01;

  public async generateTx({ amount, to, utxos, extraParams }: GenerateTxInput): Promise<TxPayload> {
    if (!this.privateKey) {
      throw new Error('No private key found');
    }

    if (!utxos?.length) {
      throw new Error('No inputs found');
    }

    /**
     * Flow is:
     * https://github.com/zcash/librustzcash/blob/28e36dc57b82fafa6b259492f3e0b18b3011e835/zcash_primitives/src/transaction/builder.rs#L628
     * -> Fee computation is done as per ZIP-317 for and max between result and 1000 zats
     *                                                       |
     *                                                       V
     * https://github.com/zcash/librustzcash/blob/28e36dc57b82fafa6b259492f3e0b18b3011e835/zcash_primitives/src/transaction/builder.rs#L660
     * -> Skipping balance check
     * -> Skipping bundle creation since (1) just struct creation with no changes to content (2) sapling & orchard are not relevant for us as
     *    only work with transparent
     * -> Skipping L739-750 (TransactionData struct creation) for same reason
     *                                                       |
     *                                                       V
     * https://github.com/zcash/librustzcash/blob/28e36dc57b82fafa6b259492f3e0b18b3011e835/zcash_primitives/src/transaction/builder.rs#L755
     * -> Goes to https://github.com/zcash/librustzcash/blob/main/zcash_primitives/src/transaction/mod.rs#L439
     * -> Goes to https://github.com/zcash/librustzcash/blob/28e36dc57b82fafa6b259492f3e0b18b3011e835/zcash_primitives/src/transaction/txid.rs
     *
     */

    const expHeight = extraParams?.get(this.KEY_EXPIRY_HEIGHT);
    const nuConfig = this.blockHeightToNetworkVersion(expHeight);
    const { txVersion: nuTxVersion, branchId: nuBranchId, versionGroupId: nuVersionGroupId } = nuConfig;

    const totalInSize = utxos.length * 150;
    const ceilDiv = (num: number, den: number): number => (num + den - 1) / den;
    const logicalActions = ceilDiv(totalInSize, utxos.length) + 1;
    const fee = Math.max(1000, 5000 * Math.max(logicalActions, 2));

    const amountToTransfer = BigInt(BTCUtilitySigner._btcToSats(amount) - fee);
    const signer = ECPairFactory(tinysecp).fromPrivateKey(Buffer.from(this.privateKey.replace('0x', ''), 'hex'));

    // Build TX output UTXO
    const [OP_CHECKSIG, OP_DUP, OP_EQUALVERIFY, OP_HASH160] = [0xac, 0x76, 0x88, 0xa9];
    const toAddressHash160 = bs58decode(to).subarray(2);
    const scriptBuffer = Buffer.concat([
      Buffer.from([OP_DUP, OP_HASH160]),
      toAddressHash160,
      Buffer.from([OP_EQUALVERIFY, OP_CHECKSIG]),
    ]);
    // https://github.com/zcash/librustzcash/blob/main/zcash_primitives/src/transaction/components/transparent.rs#L181
    const outputValueBuffer = intBuffer(8);
    outputValueBuffer.writeBigInt64LE(amountToTransfer);
    const txOutputUTXOBuffer = Buffer.concat([outputValueBuffer, scriptBuffer]);

    // https://github.com/zcash/librustzcash/blob/28e36dc57b82fafa6b259492f3e0b18b3011e835/zcash_primitives/src/transaction/txid.rs#L224
    const txVersionHeaderBuffer = intBuffer();
    // eslint-disable-next-line no-bitwise
    txVersionHeaderBuffer.writeUint32LE(((1 << 31) | nuTxVersion) >>> 0);

    // https://github.com/zcash/librustzcash/blob/main/zcash_primitives/src/transaction/mod.rs#L159
    const headerBuffer = Buffer.alloc(20);
    headerBuffer.writeUint32LE(txVersionHeaderBuffer.readUint32LE());
    headerBuffer.writeUint32LE(nuVersionGroupId, 4);
    headerBuffer.writeUint32LE(nuBranchId, 8);
    headerBuffer.writeUint32LE(0, 12);
    headerBuffer.writeUint32LE(expHeight, 16);

    // https://github.com/zcash/librustzcash/blob/28e36dc57b82fafa6b259492f3e0b18b3011e835/zcash_primitives/src/transaction/txid.rs#L203
    const prevUTXOsHasher = blakeHash('ZTxIdPrevoutHash');
    const prevUTXOSeqHasher = blakeHash('ZTxIdSequencHash');
    const newUTXOOutputHasher = blakeHash('ZTxIdOutputsHash');

    utxos.forEach((utxo) => {
      prevUTXOSeqHasher.update(seqBuffer);
      const prevOutIndexBuffer = intBuffer();
      prevOutIndexBuffer.writeUint32LE(utxo.index);
      prevUTXOsHasher.update(Buffer.from(utxo.hash, 'hex')).update(prevOutIndexBuffer);
    });

    newUTXOOutputHasher.update(txOutputUTXOBuffer);

    // https://github.com/zcash/librustzcash/blob/main/zcash_primitives/src/transaction/txid.rs#L224
    // Hash header
    const headerHash = blakeHash('ZTxIdHeadersHash').update(headerBuffer).digestHex();
    const prevOutputsHash = prevUTXOsHasher.digestHex();
    const allSeqHash = prevUTXOSeqHasher.digestHex();
    const txOutputHash = newUTXOOutputHasher.digestHex();

    // https://github.com/zcash/librustzcash/blob/main/zcash_primitives/src/transaction/builder.rs#L758 -> https://github.com/zcash/librustzcash/blob/main/zcash_primitives/src/transaction/components/transparent/builder.rs#L254
    const isV4 = [
      this.networkUpgradeConfigs.Sprout.txVersion,
      this.networkUpgradeConfigs.Sapling.txVersion,
      this.networkUpgradeConfigs.Overwinter.txVersion,
    ].includes(nuTxVersion);
    const signedUTXOs: [UTXO, Buffer][] = utxos.map((utxo) => {
      const hash = isV4
        ? this.v4Hash(nuConfig, txVersionHeaderBuffer, txOutputUTXOBuffer, expHeight, utxo)
        : this.v5Hash(utxos, nuConfig, headerHash, prevOutputsHash, allSeqHash, txOutputHash, utxo);

      const utxoSig = signer.sign(hash);
      const bufferize = (nums: number[]) => Buffer.from(nums);
      let r = utxoSig.subarray(0, 32);
      if (r.at(0)! > 0x7f) {
        r = Buffer.concat([bufferize([0x00]), r]);
      }
      let s = utxoSig.subarray(32);
      if (s.at(0)! > 0x7f) {
        s = Buffer.concat([bufferize([0x00]), s]);
      }
      const encodedSig = Buffer.concat([
        bufferize([0x30, 4 + r.length + s.length, 0x02, r.length]),
        r,
        bufferize([0x02, s.length]),
        s,
      ]);
      return [
        utxo,
        Buffer.concat([encodedSig, Buffer.from([this.SIGHASH_ALL]), Buffer.from(this.publicKey.replace('0x', ''), 'hex')]),
      ];
    });

    // https://github.com/zcash/librustzcash/blob/main/zcash_primitives/src/transaction/mod.rs#L761
    // With all the data we can now serialize the Tx.

    // Applies to v4 and v5, so keeping it outside of ifs
    const versionHeader = intBuffer(8);
    versionHeader.writeUint32LE(txVersionHeaderBuffer.readUInt32LE());
    versionHeader.writeUint32LE(nuVersionGroupId, 4);

    // Lock time is always the same - 0.
    const lockTimeBuffer = Buffer.alloc(4, 0);
    // Expiry height might be used in both <=v4 & v5
    const expHeightBuffer = intBuffer();
    expHeightBuffer.writeUint32LE(expHeight);
    // Same for inputs and outputs
    const inBuffer = Buffer.concat(
      signedUTXOs.map(([utxo, buf]) => Buffer.concat([Buffer.from(utxo.hash, 'hex'), buf, seqBuffer])),
    );
    // CompactSize::write(x,0) -> always same value
    // https://github.com/zcash/librustzcash/blob/main/components/zcash_encoding/src/lib.rs#L79
    const compactZero = Buffer.alloc(1, 0);

    const signedTxBuffers: Buffer[] = [versionHeader];
    if (isV4) {
      // https://github.com/zcash/librustzcash/blob/main/zcash_primitives/src/transaction/mod.rs#L772
      // Version is before if

      signedTxBuffers.push(inBuffer, txOutputUTXOBuffer, lockTimeBuffer);

      if (nuTxVersion !== this.networkUpgradeConfigs.Sprout.txVersion) {
        signedTxBuffers.push(expHeightBuffer);
      }

      // https://github.com/zcash/librustzcash/blob/main/zcash_primitives/src/transaction/mod.rs#L781 -> https://github.com/zcash/librustzcash/blob/main/zcash_primitives/src/transaction/components/sapling.rs#L344
      // We do not have sapling - ignoring

      // https://github.com/zcash/librustzcash/blob/main/zcash_primitives/src/transaction/mod.rs#L787
      // We might be sprout but no sprout bundle
      // So we implement the else at https://github.com/zcash/librustzcash/blob/main/zcash_primitives/src/transaction/mod.rs#L792
      signedTxBuffers.push(compactZero);

      // https://github.com/zcash/librustzcash/blob/main/zcash_primitives/src/transaction/mod.rs#L797
      // This and the next conditions are false - skipping.
    } else {
      // https://github.com/zcash/librustzcash/blob/main/zcash_primitives/src/transaction/mod.rs#L825
      // Version is before if
      const branchIdBuffer = intBuffer();
      branchIdBuffer.writeUint32LE(nuConfig.branchId);

      // Add all headers and then ins and outs
      signedTxBuffers.push(branchIdBuffer, lockTimeBuffer, expHeightBuffer, inBuffer, txOutputUTXOBuffer);

      // https://github.com/zcash/librustzcash/blob/main/zcash_primitives/src/transaction/mod.rs#L857 -> https://github.com/zcash/librustzcash/blob/main/zcash_primitives/src/transaction/components/sapling.rs#L438
      // Just adding compact zero twice.
      signedTxBuffers.push(compactZero, compactZero);

      // https://github.com/zcash/librustzcash/blob/main/zcash_primitives/src/transaction/mod.rs#L835 -> https://github.com/zcash/librustzcash/blob/main/zcash_primitives/src/transaction/components/orchard.rs#L196
      // Same as above, just a single compact zero
      signedTxBuffers.push(compactZero);
    }

    const fullTx = Buffer.concat(signedTxBuffers);

    return {
      tx: fullTx.toString('hex'),
    };
  }

  // https://github.com/zcash/librustzcash/blob/main/zcash_primitives/src/transaction/sighash_v4.rs#L135
  private v4Hash(
    currNUConfig: NetworkUpgradeConfiguration,
    txVersionHeader: Buffer,
    txOutputBuffer: Buffer,
    expHeight: number,
    specificUTXO: UTXO,
  ) {
    if (currNUConfig.txVersion === this.networkUpgradeConfigs.Sprout.txVersion) {
      throw new Error('Signing not supported for pre overwinter');
    }
    const personalizeBuffer = Buffer.alloc(16);
    const versionGroupBuf = intBuffer();
    const emptyBuffer = Buffer.alloc(32);
    emptyBuffer.fill(0, 0, 32);

    personalizeBuffer.write('ZcashSigHash');
    personalizeBuffer.writeUint32LE(currNUConfig.branchId, 12);
    const hasher = blakeHash(personalizeBuffer);

    hasher.update(txVersionHeader);
    versionGroupBuf.writeUint32LE(currNUConfig.versionGroupId);
    hasher.update(versionGroupBuf);

    // https://github.com/zcash/librustzcash/blob/main/zcash_primitives/src/transaction/sighash_v4.rs#L157 && https://github.com/zcash/librustzcash/blob/main/zcash_primitives/src/transaction/sighash_v4.rs#L166
    // Test condition is false since we're always using transparent with SIGHASH_ALL which yields 0x01 & 0x80 !== 0
    // So we just update twice with empty 32 byte buffer.
    hasher.update(emptyBuffer);
    hasher.update(emptyBuffer);

    // https://github.com/zcash/librustzcash/blob/main/zcash_primitives/src/transaction/sighash_v4.rs#L176
    // Like the above, we don't need to do the test, just go into the clause
    const outBufferHash = blakeHash('ZcashOutputsHash').update(txOutputBuffer).digest();
    hasher.update(outBufferHash);

    // https://github.com/zcash/librustzcash/blob/main/zcash_primitives/src/transaction/sighash_v4.rs#L200
    // Similar to the above, we do not have any sprout bundles, so condition is false and we just add empty byte buffer
    hasher.update(emptyBuffer);

    const lockTimeBuffer = Buffer.alloc(4, 0);
    const expHeightBuffer = intBuffer();
    expHeightBuffer.writeUint32LE(expHeight);

    const sighashTypeBuffer = intBuffer();
    sighashTypeBuffer.writeUint32LE(this.SIGHASH_ALL);

    hasher.update(lockTimeBuffer);
    hasher.update(expHeightBuffer);
    hasher.update(sighashTypeBuffer);

    // const utxoBuffer = Buffer.alloc(48); // 32 hash + 4 index + 8 value + 4 sequence
    const hashBuf = Buffer.from(specificUTXO.hash);
    const indexBuf = intBuffer();
    indexBuf.writeUint32LE(specificUTXO.index);

    const valueBuf = Buffer.alloc(8);
    valueBuf.writeBigInt64LE(BigInt(BTCUtilitySigner._btcToSats(specificUTXO.value)));

    const utxoBuffer = Buffer.concat([hashBuf, indexBuf, valueBuf, seqBuffer]);
    hasher.update(utxoBuffer);

    return hasher.digestHex();
  }

  // https://github.com/zcash/librustzcash/blob/main/zcash_primitives/src/transaction/sighash_v5.rs#L173
  private v5Hash(
    utxos: UTXO[],
    netParams: NetworkUpgradeConfiguration,
    headerHash: Buffer,
    prevOutHash: Buffer,
    seqHash: Buffer,
    outHash: Buffer,
    specificUTXO: UTXO,
  ) {
    // Important - this is where coinbase related data is important, but we currently do not support it

    // https://github.com/zcash/librustzcash/blob/main/zcash_primitives/src/transaction/sighash_v5.rs#L52
    // First we compute transparent sig hash
    const amountHasher = blakeHash('ZTxTrAmountsHash');
    const scriptHasher = blakeHash('ZTxTrScriptsHash');
    utxos.forEach((utxo) => {
      const amountBuf = Buffer.alloc(8);
      amountBuf.writeBigInt64LE(BigInt(BTCUtilitySigner._btcToSats(utxo.value)));

      amountHasher.update(amountBuf);

      scriptHasher.update(Buffer.from((utxo as any).witnessUtxo.script, 'hex'));
    });
    const amountHash = Buffer.from(amountHasher.digest());

    const chHasher = blakeHash('Zcash___TxInHash');

    const buffers = [
      Buffer.from(specificUTXO.hash, 'hex'),
      intBuffer(),
      intBuffer(8),
      Buffer.from((specificUTXO as any).witnessUtxo.script),
      seqBuffer,
    ];
    buffers[1].writeUint32LE(specificUTXO.index);
    buffers[2].writeBigInt64LE(BigInt(BTCUtilitySigner._btcToSats(specificUTXO.value)));

    chHasher.update(Buffer.concat(buffers));

    const specificUTXOHash = chHasher.digest();

    const transferSigHasher = blakeHash('ZTxIdTranspaHash');
    transferSigHasher.update(
      Buffer.concat([
        Buffer.from([this.SIGHASH_ALL]),
        prevOutHash,
        amountHash,
        scriptHasher.digest(),
        seqHash,
        outHash,
        specificUTXOHash,
      ]),
    );

    const transferSigHash = transferSigHasher.digest();

    // Now we implement the to_hash - https://github.com/zcash/librustzcash/blob/main/zcash_primitives/src/transaction/txid.rs#L367
    const personalizeBuffer = Buffer.alloc(16);
    personalizeBuffer.write('ZcashTxHash_');
    personalizeBuffer.writeUint32LE(netParams.branchId, 12);

    const hasher = blakeHash(personalizeBuffer);

    hasher.update(headerHash);
    hasher.update(transferSigHash);
    // No sapling - empty hash
    hasher.update(blakeHash('ZTxIdSaplingHash').digest());
    hasher.update(blakeHash('ZTxIdOrchardHash').digest());

    return hasher.digestHex();
  }

  private blockHeightToNetworkVersion(blockHeight: number): NetworkUpgradeConfiguration {
    const upgradesSortedByActivationHeight = Object.values(this.networkUpgradeConfigs).sort((n) => n.activationHeight);
    // .reverse();

    const network = upgradesSortedByActivationHeight.reduce(
      (prev: NetworkUpgradeConfiguration | undefined, curr) =>
        // eslint-disable-next-line no-nested-ternary
        prev === undefined
          ? curr
          : prev.activationHeight < curr.activationHeight && curr.activationHeight < blockHeight
          ? curr
          : prev,
      undefined,
    );

    if (!network) throw new Error(`Unable to deteremine network upgrade for block height: ${blockHeight}`);
    return network!;
  }
}
