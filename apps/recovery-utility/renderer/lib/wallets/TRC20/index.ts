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
      const rpcUrl = extraParams?.get('r');

      // eslint-disable-next-line global-require
      const TronWeb = require('tronweb');
      const { HttpProvider } = TronWeb.providers;
      const fullNode = new HttpProvider(rpcUrl);
      const solidityNode = new HttpProvider(rpcUrl);
      const eventServer = new HttpProvider(rpcUrl);
      const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, this.privateKey?.replace('0x', ''));

      const decimals = extraParams?.get('d');
      if (!decimals) {
        this.utilityLogger.error('TRC20: Decimals not set');
      }
      const tokenAddress = extraParams?.get('t');

      const functionSelector = 'transfer(address,uint256)';
      const parameter = [
        { type: 'address', value: to },
        { type: 'uint256', value: amount * 10 ** decimals },
      ];

      const tx = await tronWeb.transactionBuilder.triggerSmartContract(
        tokenAddress,
        functionSelector,
        { feeLimit: feeRate },
        parameter,
      );

      const signedTx = await tronWeb.trx.sign(tx.transaction);

      this.utilityLogger.logSigningTx('TRC20', signedTx);

      //encode and compress for qr code
      const gzip = promisify(zlib.gzip);
      const compressedTx = (await gzip(JSON.stringify(signedTx))).toString('base64');

      return { tx: compressedTx };
    } catch (e) {
      this.utilityLogger.error('TRC20: Error generating tx:', e);
      throw new Error(`TRC20: Error generating tx: ${e}`);
    }
  }
}
