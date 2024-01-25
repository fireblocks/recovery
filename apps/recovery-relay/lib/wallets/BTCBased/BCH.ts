import { BitcoinCash as BCHBase, Input } from '@fireblocks/wallet-derivation';
import { Networks, Transaction } from 'bitcore-lib-cash';
import { AccountData, BaseUTXOType } from '../types';
import { LateInitConnectedWallet } from '../LateInitConnectedWallet';
import { BCHUTXO } from './types';

export class BitcoinCash extends BCHBase implements LateInitConnectedWallet {
  private endpoint: string;

  private network: Networks.Network;

  constructor(input: Input) {
    super(input);
    this.endpoint = 'https://rest.bch.actorforth.org/v2';
    this.network = Networks.mainnet;
  }

  // eslint-disable-next-line class-methods-use-this
  public getLateInitLabel() {
    return '';
  }

  public isLateInit(): boolean {
    return this.isTestnet;
  }

  public updateDataEndpoint(endpoint: string): void {
    this.endpoint = endpoint;
  }

  public async getBalance(): Promise<number> {
    if (this.isLateInit() && this.endpoint === '') {
      throw new Error('Endpoint not initialized yet');
    }
    return (await this.prepare()).balance;
  }

  public async prepare(): Promise<AccountData> {
    if (this.isLateInit() && this.endpoint === '') {
      throw new Error('Endpoint not initialized yet');
    }

    const utxos = (await this._getBCHUTXOs()).map((bchutxo) => ({
      hash: bchutxo.txid,
      value: bchutxo.amount,
      index: bchutxo.vout,
      confirmed: bchutxo.confirmations > 0,
    }));

    const balance = utxos.map((utxo) => utxo.value as number).reduce((p, c) => p + c);

    const preparedData = {
      utxoType: BaseUTXOType,
      utxos,
      balance,
    };

    this.relayLogger.logPreparedData('BTC-Cash', preparedData);
    return preparedData as AccountData;
  }

  public async broadcastTx(txHex: string): Promise<string> {
    const tx = Transaction.fromString(txHex);

    const path = `/rawtransactions/sendRawTransaction/${tx.serialize()}`;
    const res = await this._post(path);
    if (res === true) {
      this.relayLogger.info(`Bitcoin Cash: Tx broadcasted: ${tx.id}`);
      return tx.id;
    }
    this.relayLogger.error(`Bitcoin Cash: Error broadcasting tx`);
    throw Error('Failed to send transaction.');
  }

  private async _get<T>(path: string) {
    const res = await fetch(`${this.endpoint}${path}`);

    const data: Promise<T> = res.json();

    return data;
  }

  private async _post(path: string) {
    const res = await fetch(`${this.endpoint}${path}`, {
      method: 'POST',
    });

    return res.status === 200;
  }

  private async _getBCHUTXOs() {
    const { utxos } = await this._get<{ utxos: BCHUTXO[] }>(`/address/utxo/${this.address}`);
    return utxos;
  }
}
