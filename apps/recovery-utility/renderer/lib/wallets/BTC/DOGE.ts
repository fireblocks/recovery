import { DogeCoin as BaseDOGE } from '@fireblocks/wallet-derivation';
import DogeCore from 'bitcore-lib-doge';
import { SigningWallet } from '../SigningWallet';
import { GenerateTxInput, TxPayload } from '../types';

export class DOGE extends BaseDOGE implements SigningWallet {
  private static readonly satsPerDoge = 100000000;

  private static _dogeToSats(doge: number) {
    return Math.floor(doge * DOGE.satsPerDoge);
  }

  public async generateTx({ amount, to, utxos, feeRate }: GenerateTxInput): Promise<TxPayload> {
    if (!this.privateKey) {
      throw new Error('No private key found');
    }

    if (!utxos?.length) {
      throw new Error('No inputs found');
    }

    const unsignedTx = new DogeCore.Transaction()
      .from(
        utxos.map((utxo) =>
          DogeCore.Transaction.UnspentOutput.fromObject({
            txId: utxo.hash,
            outputIndex: utxo.index,
            satoshis: DOGE._dogeToSats(utxo.value) - 1024,
            script: (utxo as any).witnessUtxo.script,
          }),
        ),
      )
      .fee(DOGE._dogeToSats(1))
      .to(to, DOGE._dogeToSats(amount) - 1024);

    const tx = new DogeCore.Transaction()
      .from(
        utxos.map((utxo) =>
          DogeCore.Transaction.UnspentOutput.fromObject({
            txId: utxo.hash,
            outputIndex: utxo.index,
            satoshis: DOGE._dogeToSats(utxo.value),
            script: (utxo as any).witnessUtxo.script,
          }),
        ),
      )
      .fee(unsignedTx._estimateSize() * (feeRate ?? 2))
      .to(to, DOGE._dogeToSats(amount) - unsignedTx._estimateSize() * (feeRate ?? 2));

    this.utilityLogger.logSigningTx('Doge', tx.toJSON());

    const signedTx = tx.sign(this.privateKey.replace('0x', ''));

    return {
      tx: signedTx.serialize(),
    };
  }
}
