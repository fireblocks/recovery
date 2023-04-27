import { Ripple as BaseRipple } from '@fireblocks/wallet-derivation';
import { SigningWallet } from '../SigningWallet';
import { GenerateTxInput, TxPayload } from '../types';
import SuperJSON from 'superjson';
import { Payment, Wallet } from 'xrpl';

export class Ripple extends BaseRipple implements SigningWallet {
  public async generateTx({ extraParams }: GenerateTxInput): Promise<TxPayload> {
    const tx = SuperJSON.parse<Payment>(extraParams?.get(this.KEY_TX));
    const wallet = new Wallet(this.publicKey.replace('0x', ''), this.privateKey!.replace('0x', ''));
    const signedTx = wallet.sign(tx);
    return {
      tx: signedTx.tx_blob,
    };
  }
}
