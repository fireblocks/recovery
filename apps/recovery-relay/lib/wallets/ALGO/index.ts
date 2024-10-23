import { Algorand as BaseALGO } from '@fireblocks/wallet-derivation';
import { Algodv2 } from 'algosdk';
import { AccountData } from '../types';
import { LateInitConnectedWallet } from '../LateInitConnectedWallet';

export class Algorand extends BaseALGO implements LateInitConnectedWallet {
  public rpcURL: string | undefined;

  private algoClient: Algodv2 | undefined;

  public updateDataEndpoint(endpoint: string): void {
    this.rpcURL = endpoint;
  }

  public setRPCUrl(url: string): void {
    this.rpcURL = url;
  }

  public getLateInitLabel(): string {
    return 'Please provide the address of the ALGO node (host:port:API-Token)';
  }

  public async getBalance(): Promise<number> {
    this.createClient();
    const accountInfo = await this.algoClient?.accountInformation(this.address).do();
    if (!accountInfo) {
      throw new Error('No account info found');
    }
    return accountInfo.amount;
  }

  public async prepare(): Promise<AccountData> {
    this.createClient();

    const balance = await this.getBalance();
    const suggestedParams = await this.algoClient!.getTransactionParams().do();
    const extraParams = new Map<string, any>();

    extraParams.set(this.KEY_SUGGESTED_PARAMS, suggestedParams);

    this.relayLogger.logPreparedData('Algorand', {
      balance,
      extraParams,
      // endpoint: this.endpoint, - do not log endpoint as it might contain confidential information
    });

    return {
      balance,
      extraParams,
      endpoint: this.rpcURL,
    };
  }

  public broadcastTx(tx: string): Promise<string> {
    throw new Error('Method not implemented.');
  }

  private createClient() {
    if (!this.rpcURL) {
      throw new Error('Wallet not initialized yet');
    }

    if (this.algoClient) {
      return;
    }

    const [host, port, apiToken] = this.rpcURL.split(':');

    this.algoClient = new Algodv2(apiToken, host, parseInt(port, 10));
  }
}
