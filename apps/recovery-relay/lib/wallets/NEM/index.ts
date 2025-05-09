import { NEM as BaseNEM, Input } from '@fireblocks/wallet-derivation';
import { ConnectedWallet } from '../ConnectedWallet';
import { AccountData } from '../types';
import axios from 'axios';
export class NEM extends BaseNEM implements ConnectedWallet {
  public rpcURL: string | undefined;

  private endpoint: string | undefined;

  private readonly defaultPort: number = 7890;
  private readonly websocketPort: number = 7778;

  public setRPCUrl(url: string): void {
    this.rpcURL = url;
    this.endpoint = this.isTestnet ? `${url}:${this.defaultPort}` : `${url}:${this.defaultPort}`;
  }

  public async getBalance(): Promise<number> {
    const accountData = (
      await axios({
        method: 'GET',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        url: this.endpoint! + `/account/get?address=${this.address}`,
      })
    ).data.account;
    return accountData.balance / 1000000;
  }

  public async prepare(): Promise<AccountData> {
    const preparedData = {
      balance: await this.getBalance(),
    };

    this.relayLogger.logPreparedData('NEM', preparedData);
    return preparedData;
  }

  public async broadcastTx(tx: string): Promise<string> {
    const finalizedTx = JSON.parse(Buffer.from(tx, 'hex').toString());
    const txRes = (
      await axios({
        method: 'POST',
        url: `${this.endpoint!}/transaction/announce`,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.from(tx, 'hex').byteLength,
        },
        data: finalizedTx,
      })
    ).data;
    if (txRes.message && txRes.message !== 'SUCCESS') {
      this.relayLogger.error(`NEM: Error broadcasting tx: ${txRes.message}`);
      throw new Error(txRes.message);
    }
    this.relayLogger.debug(`NEM: Tx broadcasted: ${txRes}`);
    return txRes.transactionHash.data;
  }
}
