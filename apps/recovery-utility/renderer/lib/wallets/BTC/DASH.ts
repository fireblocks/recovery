import { DASH as BaseDASH } from '@fireblocks/wallet-derivation';
import { PrivateKey, Transaction } from '@dashevo/dashcore-lib';
import { SigningWallet } from '../SigningWallet';

import { BTCSegwitUTXO, GenerateTxInput, TxPayload } from '../types';
import { BTCUtilitySigner } from './BTCUtilitySigner';

export class DASH extends BaseDASH implements SigningWallet {
  public async generateTx({ to, amount, utxos, feeRate }: GenerateTxInput): Promise<TxPayload> {
    if (!utxos) {
      throw new Error('No UTXOs specified.');
    }

    const tx = new Transaction(undefined)
      .from(
        utxos.map((utxo) => ({
          txId: utxo.hash,
          prevTxId: utxo.hash,
          outputIndex: utxo.index,
          satoshis: BTCUtilitySigner._btcToSats(utxo.value),
          script: (utxo as any).witnessUtxo.script,
        })),
      )
      .to(to, BTCUtilitySigner._btcToSats(amount) - 1024)
      .sign(new PrivateKey(this.privateKey!.replace('0x', '')));
    // @ts-ignore function exists
    const fee = tx._estimateSize() * 10;
    const signedTx = new Transaction(undefined)
      .from(
        utxos.map((utxo) => ({
          txId: utxo.hash,
          prevTxId: utxo.hash,
          outputIndex: utxo.index,
          satoshis: BTCUtilitySigner._btcToSats(utxo.value),
          script: (utxo as any).witnessUtxo.script,
        })),
      )
      .to(to, BTCUtilitySigner._btcToSats(amount) - fee)
      .sign(new PrivateKey(this.privateKey!.replace('0x', '')));

    return {
      tx: signedTx.serialize({ disableLargeFees: true }),
    };
  }
}
