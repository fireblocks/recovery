import { Algorand as BaseALGO } from '@fireblocks/wallet-derivation';
import algoSdk from 'algosdk';

import { SigningWallet } from '../SigningWallet';
import { GenerateTxInput, TxPayload } from '../types';

export class ALGO extends BaseALGO implements SigningWallet {
  public async generateTx({ to, amount, extraParams }: GenerateTxInput): Promise<TxPayload> {
    const tx = algoSdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: this.address,
      suggestedParams: extraParams?.get(this.KEY_SUGGESTED_PARAMS) as algoSdk.SuggestedParams,
      amount,
      to,
    });

    const bytesToSign = tx.bytesToSign();
    const sig = await this.sign(bytesToSign);
    const signedTx = {
      sig,
      txn: tx.get_obj_for_encoding(),
    };
    const finalTx = algoSdk.encodeObj(signedTx);
    return {
      tx: Buffer.from(finalTx).toString('hex'),
    };
  }
}
