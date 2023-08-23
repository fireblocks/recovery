import { Algorand as BaseALGO } from '@fireblocks/wallet-derivation';
import algoSdk from 'algosdk';

import { SigningWallet } from '../SigningWallet';
import { GenerateTxInput, TxPayload } from '../types';

export class Algorand extends BaseALGO implements SigningWallet {
  public async generateTx({ to, amount, extraParams }: GenerateTxInput): Promise<TxPayload> {
    const tx = algoSdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: this.address,
      suggestedParams: extraParams?.get(this.KEY_SUGGESTED_PARAMS) as algoSdk.SuggestedParams,
      amount,
      to,
    });

    this.utilityLogger.debug(`ALGO: Signing tx: ${JSON.stringify(tx.toString(), null, 2)}`);
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
