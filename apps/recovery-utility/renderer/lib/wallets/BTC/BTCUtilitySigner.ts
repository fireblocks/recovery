import { Psbt, initEccLib } from 'bitcoinjs-lib';
import * as tinysecp from 'tiny-secp256k1';
import { ECPairFactory } from 'ecpair';
import { GenerateTxInput, TxPayload } from '../types';

initEccLib(tinysecp);

export class BTCUtilitySigner {
  private static readonly satsPerBtc = 100000000;

  constructor() {
    throw new Error('Unsupported');
  }

  public static _btcToSats(btc: number) {
    return btc * BTCUtilitySigner.satsPerBtc;
  }

  public async generateTx({ to, amount, utxos, feeRate }: GenerateTxInput): Promise<TxPayload> {
    // @ts-ignore calling reuqires a bind
    const { isLegacy, privateKey, utilityLogger: logger, network } = this;
    if (!privateKey) {
      throw new Error('No private key found');
    }

    if (!utxos?.length) {
      throw new Error('No inputs found');
    }

    if (typeof feeRate !== 'number') {
      throw new Error('Fee rate is not a number');
    }

    const tx = new Psbt({ network });

    // eslint-disable-next-line no-restricted-syntax
    for (const input of utxos) {
      tx.addInput({
        hash: input.hash,
        index: input.index,
        ...('witnessUtxo' in input
          ? {
              witnessUtxo: {
                script: Buffer.from((input as any).witnessUtxo.script, 'hex'),
                value: (input as any).witnessUtxo.value,
              },
            }
          : { nonWitnessUtxo: Buffer.from((input as any).nonWitnessUtxo, 'hex') }),
      });
    }

    const satAmount = BTCUtilitySigner._btcToSats(amount);
    const vBytes = isLegacy ? 148 * utxos.length + 34 + 10 : 68 * utxos.length + 31 + 10.5;
    const fee = feeRate * Math.ceil(vBytes);
    const actualAmount = Math.ceil(satAmount - fee);

    tx.addOutput({
      address: to,
      value: actualAmount,
    });

    logger.logSigningTx('BTC', { inputs: tx.txInputs, outputs: tx.txOutputs });

    const signer = ECPairFactory(tinysecp).fromPrivateKey(Buffer.from(privateKey.replace('0x', ''), 'hex'));

    tx.signAllInputs(signer);
    const signedTx = tx.finalizeAllInputs();

    return {
      tx: signedTx.extractTransaction().toHex(),
    };
  }
}
