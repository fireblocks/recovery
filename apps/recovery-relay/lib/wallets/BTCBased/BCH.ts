import { BitcoinCash as BCHBase, Input } from '@fireblocks/wallet-derivation';
import bchLib from 'bitcore-lib-cash';
import { AccountData, TxInput, TxPayload, RawSignature, BaseUTXOType } from '../types';
import { LateInitConnectedWallet } from '../LateInitConnectedWallet';
import { BCHUTXO } from './types';

export class BitcoinCash extends BCHBase implements LateInitConnectedWallet {
  private endpoint: string;

  private network: bchLib.Networks.Network;

  constructor(input: Input) {
    super(input);
    this.endpoint = input.isTestnet ? '' : 'https://rest.bch.actorforth.org/v2';
    this.network = input.isTestnet ? bchLib.Networks.testnet : bchLib.Networks.mainnet;
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

    const utxos: TxInput[] = (await this._getBCHUTXOs()).map((bchutxo) => ({
      hash: bchutxo.txid,
      value: bchutxo.amount,
      index: bchutxo.vout,
      confirmed: bchutxo.confirmations > 0,
    }));

    const balance = utxos.map((utxo) => utxo.value as number).reduce((p, c) => p + c);

    return {
      utxoType: BaseUTXOType,
      utxos,
      balance,
    };
  }

  public async generateTx(
    to: string,
    amount: number,
    memo?: string | undefined,
    utxos?: TxInput[] | undefined,
  ): Promise<TxPayload> {
    const bchUTXOs = new Map((await this._getBCHUTXOs()).map((utxo) => [utxo.txid, utxo]));
    const allowedUTXOs = utxos!.filter((utxo) => bchUTXOs.get(utxo.hash) !== undefined);
    let currentSum = 0;
    let utxoCount = 0;
    allowedUTXOs.forEach((utxo) => {
      if (currentSum / 10 ** 8 > amount) {
        return;
      }
      currentSum += utxo.value as number;
      utxoCount += 1;
    });
    if (currentSum / 10 ** 8 < amount) {
      throw new Error('Insufficient amount selected.');
    }

    const utxosToUse: bchLib.Transaction.UnspentOutput[] = allowedUTXOs.slice(0, utxoCount).map((utxo) => {
      const bchUTXO = bchUTXOs.get(utxo.hash)!;
      return bchLib.Transaction.UnspentOutput.fromObject({
        address: bchLib.Address.fromScript(bchLib.Script.fromString(bchUTXO.scriptPubKey), this.network),
        txId: bchUTXO.txid,
        outputIndex: bchUTXO.vout,
        script: bchLib.Script.fromString(bchUTXO.scriptPubKey),
        satoshis: bchUTXO.satoshis,
      });
    });

    const unsignedTx = new bchLib.Transaction()
      .from(utxosToUse)
      .to(to, amount * 10 ** 8)
      .serialize();
    return {
      derivationPath: this.pathParts,
      tx: unsignedTx,
    };
  }

  public async broadcastTx(txHex: string, sigs: RawSignature[]): Promise<string> {
    const tx = bchLib.Transaction.fromString(txHex);
    sigs.forEach((sig) => {
      tx.applySignature(bchLib.crypto.Signature.fromString(`${sig.r + sig.s}${Buffer.from([sig.v]).toString('hex')}`));
    });
    const path = `/rawtransactions/sendRawTransaction/${tx.serialize()}`;
    const res = await this._post(path);
    if (res === true) {
      return tx.id;
    }
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

  private async _getBCHUTXOs(): Promise<BCHUTXO[]> {
    return this._get<BCHUTXO[]>(`/address/utxo/${this.address}`);
  }
}
