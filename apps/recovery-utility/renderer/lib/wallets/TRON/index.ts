import { Tron as BaseTron } from '@fireblocks/wallet-derivation';
import { SigningWallet } from '../SigningWallet';
import { GenerateTxInput, TxPayload } from '../types';
import SuperJSON from 'superjson';

export class Tron extends BaseTron implements SigningWallet {
  public async generateTx({ to, amount, extraParams }: GenerateTxInput): Promise<TxPayload> {
    const tronWeb = require('tronweb');
    const metadata = extraParams?.get(this.KEY_METADATA);
    const data = {
      to_address: tronWeb.address.toHex(to),
      owner_address: tronWeb.address.toHex(this.address),
      amount: amount * 1_000_000,
    };
    let tx = {
      visible: false,
      txID: '',
      raw_data_hex: '',
      raw_data: {
        contract: [
          {
            parameter: {
              value: data,
              type_url: 'type.googleapis.com/protocol.TransferContract',
            },
            type: 'TransferContract',
          },
        ],
        ...metadata,
      },
    };

    const pb = tronWeb.utils.transaction.txJsonToPb(tx);
    tx.txID = tronWeb.utils.transaction.txPbToTxID(pb).replace(/^0x/, '');
    tx.raw_data_hex = tronWeb.utils.transaction.txPbToRawDataHex(pb).toLowerCase();
    const signedTx = tronWeb.utils.crypto.signTransaction(Buffer.from(this.privateKey!.replace('0x', ''), 'hex'), tx);
    return {
      tx: SuperJSON.stringify(signedTx),
    };
  }
}
