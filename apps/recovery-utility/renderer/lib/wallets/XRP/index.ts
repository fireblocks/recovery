import { Ripple as BaseRipple } from '@fireblocks/wallet-derivation';
import { SigningWallet } from '../SigningWallet';
import { GenerateTxInput, TxPayload } from '../types';
import SuperJSON from 'superjson';
import { Payment, Wallet, Client } from 'xrpl';

export class Ripple extends BaseRipple implements SigningWallet {
  public async generateTx({ extraParams, amount, memo, to }: GenerateTxInput): Promise<TxPayload> {
    const fee = extraParams?.get(this.KEY_FEE);
    const lSeq = extraParams?.get(this.KEY_LEDGER_SEQUENCE);
    const seq = extraParams?.get(this.KEY_SEQUENCE);

    const xrpClient = new Client('wss://localhost');
    const tx = await xrpClient.autofill({
      TransactionType: 'Payment',
      Account: `${this.address}`,
      Amount: `${amount * 10 ** 6 - parseInt(fee)}`,
      Destination: `${to}`,
      Memos: memo
        ? [
            {
              Memo: {
                MemoData: memo,
              },
            },
          ]
        : undefined,
      LastLedgerSequence: lSeq, // ~5 Minutes
      Sequence: parseInt(seq),
      Fee: fee,
    });

    if (!memo) {
      delete tx.Memos;
    }
    const wallet = new Wallet(this.publicKey.replace('0x', ''), this.privateKey!.replace('0x', ''));
    const signedTx = wallet.sign(tx);
    return {
      tx: signedTx.tx_blob,
    };
  }
}
