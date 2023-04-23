import { Tron as BaseTron } from '@fireblocks/wallet-derivation';
import { SigningWallet } from '../SigningWallet';
import { GenerateTxInput, TxPayload } from '../types';
import SuperJSON from 'superjson';

export class Tron extends BaseTron implements SigningWallet {
  public async generateTx({ extraParams }: GenerateTxInput): Promise<TxPayload> {
    const tronWeb = require('tronweb');
    const origTx = SuperJSON.parse<object>(extraParams?.get(this.KEY_TX));
    const signedTx = tronWeb.utils.crypto.signTransaction(Buffer.from(this.privateKey!.replace('0x', ''), 'hex'), origTx);
    return {
      tx: SuperJSON.stringify(signedTx),
    };
  }
}
