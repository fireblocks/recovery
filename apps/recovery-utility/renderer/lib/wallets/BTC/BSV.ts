import { BitcoinSV as BaseBitcoinSV } from '@fireblocks/wallet-derivation';
import { decode as decodeBase58 } from 'bs58check';
import { sha256 } from '@noble/hashes/sha256';
import { initEccLib } from 'bitcoinjs-lib';
import * as tinysecp from 'tiny-secp256k1';
import { ECPairFactory } from 'ecpair';
import { SigningWallet } from '../SigningWallet';
import { GenerateTxInput, TxPayload } from '../types';
import { BTCUtilitySigner } from './BTCUtilitySigner';

initEccLib(tinysecp);

export class BitcoinSV extends BaseBitcoinSV implements SigningWallet {
  public async generateTx({ utxos, feeRate, amount, to }: GenerateTxInput): Promise<TxPayload> {
    if (!utxos) {
      throw new Error('No UTXOs provided.');
    }

    const intToVariableInt = (int: number) => {
      let buf: Buffer;
      if (int < 2 ** 8 - 3) {
        buf = Buffer.alloc(1);
        buf.writeUint8(int);
      } else if (int <= 2 ** 16 - 1) {
        buf = Buffer.alloc(2);
        const tmpBuffer = Buffer.from([0xfd, int]);
        buf.writeUInt16LE(tmpBuffer.readUInt16LE());
      } else if (int <= 2 ** 32 - 1) {
        buf = Buffer.alloc(4);
        const tmpBuffer = Buffer.from([0xfe, int]);
        buf.writeUInt32LE(tmpBuffer.readUInt32LE());
      } else {
        buf = Buffer.alloc(8);
        const tmpBuffer = Buffer.from([0xff, int]);
        buf.writeBigUInt64LE(tmpBuffer.readBigUInt64LE());
      }
      return buf;
    };

    const toBufferLE = (int: number) => {
      const buf = Buffer.alloc(1);
      buf.writeUInt8(int);
      return buf;
    };

    const sha256x2 = (buf: Buffer): Uint8Array => sha256.create().update(sha256.create().update(buf).digest()).digest();

    const [OP_CHECKSIG, OP_DUP, OP_EQUALVERIFY, OP_HASH160, OP_PUSH_20] = [0xac, 0x76, 0x88, 0xa9, 0x14];

    const scriptCode = Buffer.concat([
      Buffer.from([OP_DUP, OP_HASH160, OP_PUSH_20]),
      decodeBase58(this.address).subarray(1),
      Buffer.from([OP_EQUALVERIFY, OP_CHECKSIG]),
    ]);

    const scriptCodeLength = intToVariableInt(scriptCode.length);

    const [verBuf, lockTimeBuf, hashTypeBuf] = [Buffer.alloc(4), Buffer.alloc(4), Buffer.alloc(4)];
    verBuf.writeUint32LE(0x01);
    lockTimeBuf.writeUint32LE(0x00);
    hashTypeBuf.writeUint32LE(0x41);

    const [ver, lockTime, hashType, inputCount, outputCount, pubKey, pubkeyLength] = [
      verBuf,
      lockTimeBuf,
      hashTypeBuf,
      intToVariableInt(utxos.length),
      intToVariableInt(1),
      Buffer.from(this.publicKey.replace('0x', ''), 'hex'),
      toBufferLE(Buffer.from(this.publicKey.replace('0x', ''), 'hex').length),
    ];

    const outputDataArray: Buffer[] = [];

    const amountBuf = Buffer.alloc(8);
    amountBuf.writeBigUInt64LE(
      BigInt(BTCUtilitySigner._btcToSats(amount)) -
        BigInt((11 + 148 * utxos.length + 34 + intToVariableInt(utxos.length).length) * (feeRate ?? 1)), // Standard tx size computaiton
    );

    outputDataArray.push(amountBuf);
    const outputScript = Buffer.concat([
      Buffer.from([OP_DUP, OP_HASH160, OP_PUSH_20]),
      decodeBase58(to).subarray(1),
      Buffer.from([OP_EQUALVERIFY, OP_CHECKSIG]),
    ]);
    outputDataArray.push(intToVariableInt(outputScript.length));
    outputDataArray.push(outputScript);

    const inputObjArray: { txId: Buffer; txIdx: Buffer; amount: Buffer }[] = [];
    utxos.forEach((utxo) => {
      const txIdx = Buffer.alloc(4);
      txIdx.writeUInt32LE(utxo.index);
      const tmpAmountBuf = Buffer.alloc(8);
      tmpAmountBuf.writeBigUint64LE(BigInt(BTCUtilitySigner._btcToSats(utxo.value)));
      inputObjArray.push({
        txId: Buffer.from(utxo.hash, 'hex').reverse(),
        txIdx,
        amount: tmpAmountBuf,
      });
    });

    const hashPrevOuts = Buffer.from(
      sha256x2(Buffer.concat(inputObjArray.map((input) => Buffer.concat([input.txId, input.txIdx])))),
    );
    const hashSequence = Buffer.from(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      sha256x2(Buffer.concat(inputObjArray.map((_input) => Buffer.from([0xff, 0xff, 0xff, 0xff])))),
    );
    const hashOutputs = Buffer.from(sha256x2(Buffer.concat(outputDataArray)));

    const signer = ECPairFactory(tinysecp).fromPrivateKey(Buffer.from(this.privateKey!.replace('0x', ''), 'hex'));

    const signedInputs: { txId: Buffer; txIdx: Buffer; amount: Buffer; script: Buffer; scriptLen: Buffer }[] = inputObjArray.map(
      (input) => {
        const bufToHash = Buffer.concat([
          ver,
          hashPrevOuts,
          hashSequence,
          input.txId,
          input.txIdx,
          scriptCodeLength,
          scriptCode,
          input.amount,
          Buffer.from([0xff, 0xff, 0xff, 0xff]),
          hashOutputs,
          lockTime,
          hashType,
        ]);

        const hashToSign = sha256x2(bufToHash);
        const sig = signer.sign(Buffer.from(hashToSign));
        const bufferize = (nums: number[]) => Buffer.from(nums);
        let r = sig.subarray(0, 32);
        if (r.at(0)! > 0x7f) {
          r = Buffer.concat([bufferize([0x00]), r]);
        }
        let s = sig.subarray(32);
        if (s.at(0)! > 0x7f) {
          s = Buffer.concat([bufferize([0x00]), s]);
        }
        const encodedSig = Buffer.concat([
          bufferize([0x30, 4 + r.length + s.length, 0x02, r.length]),
          r,
          bufferize([0x02, s.length]),
          s,
        ]);
        const inputSig = Buffer.concat([encodedSig, Buffer.from([0x41])]);

        const scriptSig = Buffer.concat([toBufferLE(inputSig.length), inputSig, pubkeyLength, pubKey]);
        return { ...input, script: scriptSig, scriptLen: intToVariableInt(scriptSig.length) };
      },
    );

    const inputDataBlock = Buffer.concat(
      signedInputs.map((signedInput) => {
        const buf = Buffer.concat([
          signedInput.txId,
          signedInput.txIdx,
          signedInput.scriptLen,
          signedInput.script,
          Buffer.from([0xff, 0xff, 0xff, 0xff]),
        ]);
        return buf;
      }),
    );

    const outputDataBlock = Buffer.concat(outputDataArray);

    const signedTx = Buffer.concat([ver, inputCount, inputDataBlock, outputCount, outputDataBlock, lockTime]);
    return {
      tx: signedTx.toString('hex'),
    };
  }
}
