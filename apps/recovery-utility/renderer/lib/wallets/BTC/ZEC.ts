import { ZCash as BaseZEC } from '@fireblocks/wallet-derivation';
// eslint-disable-next-line import/no-extraneous-dependencies
import ZecCore from 'zcash-bitcore-lib';
import { SigningWallet } from '../SigningWallet';
// import { BTCUtilitySigner } from './BTCUtilitySigner';
import { GenerateTxInput, TxPayload } from '../types';

export class ZCash extends BaseZEC implements SigningWallet {
  private static readonly satsPerZec = 100000000;

  private static _zecToSats(zec: number) {
    return Math.floor(zec * ZCash.satsPerZec);
  }

  public async generateTx({ amount, to, utxos, feeRate }: GenerateTxInput): Promise<TxPayload> {
    if (!this.privateKey) {
      throw new Error('No private key found');
    }

    if (!utxos?.length) {
      throw new Error('No inputs found');
    }

    const unsignedTx = new ZecCore.Transaction()
      .from(
        utxos.map((utxo) =>
          ZecCore.Transaction.UnspentOutput.fromObject({
            txId: utxo.hash,
            outputIndex: utxo.index,
            satoshis: ZCash._zecToSats(utxo.value) - 1024,
            script: (utxo as any).witnessUtxo.script,
          }),
        ),
      )
      .fee(ZCash._zecToSats(1))
      .to(to, ZCash._zecToSats(amount) - 1024);

    // throw new Error('Not implemented');
    const tx = new ZecCore.Transaction()
      .from(
        utxos.map((utxo) =>
          ZecCore.Transaction.UnspentOutput.fromObject({
            txId: utxo.hash,
            outputIndex: utxo.index,
            satoshis: ZCash._zecToSats(utxo.value),
            script: (utxo as any).witnessUtxo.script,
          }),
        ),
      )
      .fee(unsignedTx._estimateSize() * (feeRate ?? 2))
      .to(to, ZCash._zecToSats(amount) - unsignedTx._estimateSize() * (feeRate ?? 2));

    this.utilityLogger.logSigningTx('zec', tx.toJSON());

    const signedTx = tx.sign(this.privateKey.replace('0x', ''));

    return {
      tx: signedTx.serialize(),
    };
  }
}
