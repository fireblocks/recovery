import { Buffer } from 'buffer';
import { Bitcoin as BaseBTC, Input } from '@fireblocks/wallet-derivation';
import { AddressSummary, FullUTXO, UTXOSummary } from './types';
import { AccountData, BTCLegacyUTXO, BTCSegwitUTXO, LegacyUTXOType, SegwitUTXOType } from '../types';
import { ConnectedWallet } from '../ConnectedWallet';

export class Bitcoin extends BaseBTC implements ConnectedWallet {
  private static readonly satsPerBtc = 100000000;

  private readonly baseUrl: string;

  constructor(input: Input) {
    super(input);

    this.baseUrl = input.isTestnet ? 'https://blockstream.info/testnet/api' : 'https://blockstream.info/api';
  }

  private async _request(path: string, init?: RequestInit) {
    const res = await fetch(`${this.baseUrl}${path}`, init);
    return res;
  }

  private async _requestJson<T>(path: string, init?: RequestInit) {
    const res = await this._request(path, init);
    const data = await res.json();
    return data as T;
  }

  private async _getAddressUTXOs() {
    const utxoSummary = await this._requestJson<UTXOSummary[]>(`/address/${this.address}/utxo`);
    return utxoSummary;
  }

  private async _getAddressBalance() {
    const addressSummary = await this._requestJson<AddressSummary>(`/address/${this.address}`);
    return addressSummary;
  }

  private async _getFeeRate() {
    const feeEstimate = await this._requestJson<{ [key: string]: number }>('/fee-estimates');
    const feeRate = feeEstimate['3'];
    return feeRate;
  }

  private async _getSegwitInput(utxo: UTXOSummary): Promise<BTCSegwitUTXO> {
    const { txid: hash } = utxo;
    const index = Bitcoin._satsToBtc(utxo.value);
    const fullUtxo = await this._requestJson<FullUTXO>(`/tx/${hash}`);
    const { scriptpubkey, value } = fullUtxo.vout[index];

    return {
      hash,
      index,
      witnessUtxoScript: scriptpubkey,
      confirmed: true,
      value,
    };
  }

  private async _getNonSegwitInput(utxo: UTXOSummary): Promise<BTCLegacyUTXO> {
    const { txid: hash } = utxo;
    const index = Bitcoin._satsToBtc(utxo.value);
    const rawTxRes = await this._request(`/tx/${hash}/raw`);
    const rawTx = await rawTxRes.arrayBuffer();
    const nonWitnessUtxo = Buffer.from(rawTx);

    return {
      hash,
      index,
      nonWitnessUtxo,
      confirmed: true,
      value: utxo.value,
    };
  }

  private static _satsToBtc(sats: number) {
    return sats / Bitcoin.satsPerBtc;
  }

  public async prepare(): Promise<AccountData> {
    const balance = await this.getBalance();

    const utxos = await this._getAddressUTXOs();

    const getInputMethod = this.isLegacy ? this._getNonSegwitInput : this._getSegwitInput;

    const inputs = await Promise.all(utxos.map((utxo) => getInputMethod(utxo)));

    const feeRate = await this._getFeeRate();

    return {
      balance,
      utxos: inputs,
      utxoType: this.isLegacy ? LegacyUTXOType : SegwitUTXOType,
      feeRate,
    };
  }

  public async broadcastTx(
    txHex: string,
    // signature: RawSignature[],
    // customUrl?: string | undefined
  ): Promise<string> {
    // BTC Tx are automatically signed and resulting hex is signed, so no need to do anything special.
    // const tx = Psbt.fromHex(txHex, { network: this.network });
    const txBroadcastRes = await this._request('/tx', {
      method: 'POST',
      body: txHex,
    });

    const txHash = await txBroadcastRes.text();

    return txHash;
  }

  public async getBalance() {
    const { chain_stats: chainStats } = await this._getAddressBalance();
    const balance = chainStats.funded_txo_sum - chainStats.spent_txo_sum;
    const btcBalance = Bitcoin._satsToBtc(balance);
    return btcBalance;
  }
}
