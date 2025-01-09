import { Tron as BaseTron } from '@fireblocks/wallet-derivation';
import { ConnectedWallet } from '../ConnectedWallet';
import { abi } from './trc20.abi';
import { AccountData } from '../types';

export class TRC20 extends BaseTron implements ConnectedWallet {
  private tronWeb: any | undefined;

  public rpcURL: string | undefined;

  private decimals: number | undefined;

  private tokenAddress: string | undefined;

  public setDecimals(decimals: number): void {
    this.decimals = decimals;
  }

  public setTokenAddress(tokenAddress: string): void {
    this.tokenAddress = tokenAddress;
  }

  public setRPCUrl(url: string): void {
    this.rpcURL = url;
    // eslint-disable-next-line global-require
    const TronWeb = require('tronweb');
    const { HttpProvider } = TronWeb.providers;
    const endpointUrl = this.rpcURL;
    const fullNode = new HttpProvider(endpointUrl);
    const solidityNode = new HttpProvider(endpointUrl);
    const eventServer = new HttpProvider(endpointUrl);
    this.tronWeb = new TronWeb(fullNode, solidityNode, eventServer);
  }

  public async getBalance(): Promise<number> {
    const contract = await this.tronWeb.contract(abi, this.tokenAddress);
    // eslint-disable-next-line @typescript-eslint/return-await
    return await contract.balanceOf(this.address).call();
  }

  public async getTrxBalance(): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/return-await
    return await this.tronWeb.trx.getBalance(this.address);
  }

  public async prepare(): Promise<AccountData> {
    const balance = ((await this.getBalance()) / 10 ** this.decimals!) as number;
    const trxBalance = await this.getTrxBalance();

    const extraParams = new Map<string, any>();

    extraParams.set('t', this.tokenAddress);
    extraParams.set('d', this.decimals);
    extraParams.set('r', this.rpcURL);

    const preparedData: AccountData = {
      balance,
      feeRate: 15_000_000,
      extraParams,
      insufficientBalance: balance <= 0,
      insufficientBalanceForTokenTransfer: trxBalance <= 15_000_000,
    };

    this.relayLogger.logPreparedData('TRC20', preparedData);
    return preparedData;
  }

  public async broadcastTx(tx: string): Promise<string> {
    const result = await this.tronWeb.trx.sendRawTransaction(tx);
    if ('code' in result) {
      this.relayLogger.error(`Tron: Error broadcasting tx: ${JSON.stringify(result, null, 2)}`);
      throw new Error(result.code);
    }
    this.relayLogger.debug(`TRC20: Tx broadcasted: ${result.txid}`);
    return result.txid;
  }
}
