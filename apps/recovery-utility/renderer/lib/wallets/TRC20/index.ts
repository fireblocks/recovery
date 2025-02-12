/* eslint-disable spaced-comment */
/* eslint-disable import/order */
import { Tron as BaseTron } from '@fireblocks/wallet-derivation';
import { SigningWallet } from '../SigningWallet';
import { GenerateTxInput, TxPayload } from '../types';
import zlib from 'zlib';
import { promisify } from 'util';

export class TRC20 extends BaseTron implements SigningWallet {
  public async generateTx({ to, amount, feeRate, extraParams }: GenerateTxInput): Promise<TxPayload> {
    try {
      const tronWeb = require('tronweb');
      const metadata = extraParams?.get(this.KEY_METADATA);
      metadata.fee_limit = feeRate;
      const decimals = extraParams?.get(this.KEY_DECIMALS);
      const tokenAddress = extraParams?.get(this.KEY_TOKEN_ADDRESS);
      const fixedAmount = amount * 10 ** decimals;

      //serialized data - functionSelector(transfer) + toAddress + amount
      const data = `a9059cbb${tronWeb.address.toHex(to).replace('/^(41)/', '0x').padStart(64, '0')}${fixedAmount
        .toString(16)
        .padStart(64, '0')}`;
      this.relayLogger.debug('TRC20: Data:', data);
      const tx = {
        visible: false,
        txID: '',
        raw_data_hex: '',
        raw_data: {
          contract: [
            {
              parameter: {
                value: {
                  data,
                  owner_address: tronWeb.address.toHex(this.address),
                  contract_address: tronWeb.address.toHex(tokenAddress),
                },
                type_url: 'type.googleapis.com/protocol.TriggerSmartContract',
              },
              type: 'TriggerSmartContract',
            },
          ],
          ...metadata,
        },
      };

      const pb = tronWeb.utils.transaction.txJsonToPb(tx);

      this.utilityLogger.logSigningTx('Tron', tx);

      tx.txID = tronWeb.utils.transaction.txPbToTxID(pb).replace(/^0x/, '');
      tx.raw_data_hex = tronWeb.utils.transaction.txPbToRawDataHex(pb).toLowerCase();
      const signedTx = tronWeb.utils.crypto.signTransaction(Buffer.from(this.privateKey!.replace('0x', ''), 'hex'), tx);

      //encode and compress to fit qr code limits
      const gzip = promisify(zlib.gzip);
      const compressedTx = (await gzip(JSON.stringify(signedTx))).toString('base64');

      return { tx: compressedTx };
    } catch (e) {
      this.utilityLogger.error('TRC20: Error generating tx:', e);
      throw new Error(`TRC20: Error generating tx: ${e}`);
    }
  }
}
