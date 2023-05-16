import { Tron as BaseTron, Input } from '@fireblocks/wallet-derivation';
import superjson from 'superjson';
import { ConnectedWallet } from '../ConnectedWallet';
import { AccountData } from '../types';

export class Tron extends BaseTron implements ConnectedWallet {
  private tronWeb;

  constructor(input: Input) {
    super(input);
    const TronWeb = require('tronweb');
    const { HttpProvider } = TronWeb.providers;
    const endpointUrl = input.isTestnet ? 'https://api.shasta.trongrid.io' : 'https://api.trongrid.io';
    const fullNode = new HttpProvider(endpointUrl);
    const solidityNode = new HttpProvider(endpointUrl);
    const eventServer = new HttpProvider(endpointUrl);
    this.tronWeb = new TronWeb(fullNode, solidityNode, eventServer);
  }

  public async getBalance(): Promise<number> {
    return ((await this.tronWeb.trx.getBalance(this.address)) as number) / 1_000_000;
  }

  public async prepare(to?: string): Promise<AccountData> {
    const balance = await this.getBalance();
    let tx = await this.tronWeb.transactionBuilder.sendTrx(to, balance * 1_000_000, this.address);
    tx = await this.tronWeb.transactionBuilder.extendExpiration(tx, 600); // 10 minutes
    const extraParams = new Map<string, any>();
    extraParams.set(this.KEY_TX, superjson.stringify(tx));
    return {
      balance,
      extraParams,
    };
  }

  public async broadcastTx(txHex: string): Promise<string> {
    const tx = superjson.parse<object>(txHex);
    const hash = await this.tronWeb.trx.sendRawTransaction(tx);
    if ('code' in hash) {
      throw new Error(hash.code);
    }
    //@ts-ignore
    return hash.txid;
  }
}
