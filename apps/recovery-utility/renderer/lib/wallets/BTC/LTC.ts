import { LiteCoin as BaseLTC } from '@fireblocks/wallet-derivation';
import { SigningWallet } from '../SigningWallet';
import { GenerateTxInput, TxPayload } from '../types';
import { BTCUtilitySigner } from './BTCUtilitySigner';
const litecore: any = require('bitcore-lib-ltc'); // no @types available

export class LiteCoin extends BaseLTC implements SigningWallet {
  public async generateTx({ to, amount, utxos, feeRate }: GenerateTxInput): Promise<TxPayload> {
    if (!this.privateKey) {
      throw new Error('No private key found');
    }

    if (!utxos?.length) {
      throw new Error('No inputs found');
    }
    const amountSatoshis = Math.floor(BTCUtilitySigner._btcToSats(amount));

    const tx = new litecore.Transaction()
      .from(
        utxos.map((utxo) =>
          litecore.Transaction.UnspentOutput.fromObject({
            txId: utxo.hash,
            outputIndex: utxo.index,
            satoshis: BTCUtilitySigner._btcToSats(utxo.value),
            script: (utxo as any).witnessUtxo.script,
          }),
        ),
      )
      .to(to, amountSatoshis - 1024)
      .sign(this.privateKey!.replace('0x', ''));

    const fee = tx._estimateSize() * 10;
    const signedTx = new litecore.Transaction()
      .from(
        utxos.map((utxo) =>
          litecore.Transaction.UnspentOutput.fromObject({
            txId: utxo.hash,
            outputIndex: utxo.index,
            satoshis: BTCUtilitySigner._btcToSats(utxo.value),
            script: (utxo as any).witnessUtxo.script,
          }),
        ),
      )
      .to(to, amountSatoshis - fee)
      .sign(this.privateKey!.replace('0x', ''));

    return {
      tx: signedTx.serialize(),
    };
  }
}
