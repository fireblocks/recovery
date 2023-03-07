import { Network, networks, Psbt } from "bitcoinjs-lib";
import { Buffer } from "buffer";
import { AddressSummary, FullUTXO, UTXOSummary } from "./types";
import { Bitcoin as BaseBitcoin } from "@fireblocks/wallet-derivation";
import { UTXO, AccountData, TxPayload, RawSignature } from "../types";

export class Bitcoin extends BaseBitcoin {
  private static readonly satsPerBtc = 100000000;
  private readonly network: Network;
  private readonly baseUrl: string;

  constructor(
    xpub: string,
    account: number,
    changeIndex: number,
    addressIndex: number,
    isTestnet = false,
    isLegacy = false
  ) {
    super({
      xpub,
      assetId: "BTC",
      path: { account, changeIndex, addressIndex },
      isTestnet,
      isLegacy,
    });

    this.network = networks[isTestnet ? "testnet" : "bitcoin"];
    this.baseUrl = isTestnet
      ? "https://blockstream.info/testnet/api"
      : "https://blockstream.info/api";
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
    const utxoSummary = await this._requestJson<UTXOSummary[]>(
      `/address/${this.data.address}/utxo`
    );
    return utxoSummary;
  }

  private async _getAddressBalance() {
    const addressSummary = await this._requestJson<AddressSummary>(
      `/address/${this.data.address}`
    );
    return addressSummary;
  }

  private async _getFeeRate() {
    const feeEstimate = await this._requestJson<{ [key: string]: number }>(
      "/fee-estimates"
    );
    console.info({ feeEstimate });
    const feeRate = feeEstimate["3"];
    return feeRate;
  }

  private async _addSegwitInput(tx: Psbt, utxo: UTXO) {
    const txHash = utxo.txHash;
    const index = utxo.index;
    const fullUTxo = await this._requestJson<FullUTXO>(`/tx/${txHash}`);
    const { scriptpubkey, value } = fullUTxo.vout[index];
    tx.addInput({
      hash: utxo.txHash,
      index: utxo.index,
      witnessUtxo: {
        script: Buffer.from(scriptpubkey, "hex"),
        value: value,
      },
    });
    return tx;
  }

  private async _addNonSegwitInput(tx: Psbt, utxo: UTXO) {
    const txHash = utxo.txHash;
    const rawTxRes = await this._request(`/tx/${txHash}/raw`);
    const rawTx = await rawTxRes.arrayBuffer();
    const nonWitnessUtxo = Buffer.from(rawTx);
    tx.addInput({
      hash: utxo.txHash,
      index: utxo.index,
      nonWitnessUtxo,
    });
    return tx;
  }

  private static _satsToBtc(sats: number) {
    return sats / Bitcoin.satsPerBtc;
  }

  private static _btcToSats(btc: number) {
    return btc * Bitcoin.satsPerBtc;
  }

  public async prepare(): Promise<AccountData> {
    const balance = await this.getBalance();
    const utxos = await this._getAddressUTXOs();
    return {
      balance,
      utxos: utxos.map((utxo: UTXOSummary) => {
        return {
          txHash: utxo.txid,
          confirmed: utxo.status.confirmed,
          index: utxo.vout,
          value: Bitcoin._satsToBtc(utxo.value),
        } as UTXO;
      }),
    };
  }

  public async generateTx(
    to: string,
    amount: number,
    memo?: string | undefined,
    utxos?: UTXO[] | undefined,
    additionalParameters?: Map<string, object> | undefined
  ): Promise<TxPayload> {
    const utxosToUse: UTXO[] =
      utxos !== undefined
        ? utxos!
        : (await this._getAddressUTXOs()).map((utxo: UTXOSummary) => {
            return {
              txHash: utxo.txid,
              confirmed: utxo.status.confirmed,
              index: utxo.vout,
              value: utxo.value,
            } as UTXO;
          });

    const tx = new Psbt({ network: this.network });

    for (let i = 0; i < utxosToUse.length; i++) {
      await (this.data.isLegacy
        ? this._addSegwitInput(tx, utxosToUse[i])
        : this._addNonSegwitInput(tx, utxosToUse[i]));
    }

    const feeRate = await this._getFeeRate();
    const satAmount = Bitcoin._btcToSats(amount);
    const vBytes = this.data.isLegacy
      ? 148 * utxosToUse.length + 34 + 10
      : 68 * utxosToUse.length + 31 + 10.5;
    const fee = feeRate * Math.ceil(vBytes);
    const actualAmount = Math.ceil(satAmount - fee);
    const balance = Bitcoin._btcToSats(await this.getBalance());

    if (fee > satAmount || actualAmount > balance) {
      throw new Error(
        `Insufficient funds. Tried to move ${satAmount} satoshi (after fee: ${actualAmount} satoshi) - current account balance is ${balance}.`
      );
    }

    tx.addOutput({
      address: to,
      value: actualAmount,
    });

    return {
      tx: tx.toHex(),
      derivationPath: [
        44,
        this.data.path.coinType,
        this.data.path.account,
        this.data.path.changeIndex,
        this.data.path.addressIndex,
      ],
    };
  }

  public async broadcastTx(
    txHex: string,
    signature: RawSignature,
    customUrl?: string | undefined
  ): Promise<string> {
    // BTC Tx are automatically signed and resulting hex is signed, so no need to do anything special.
    const tx = Psbt.fromHex(txHex, { network: this.network });
    const txBroadcastRes = await this._request("/tx", {
      method: "POST",
      body: txHex,
    });

    const txHash = await txBroadcastRes.text();

    return txHash;
  }

  public async getBalance() {
    const { chain_stats } = await this._getAddressBalance();
    const balance = chain_stats.funded_txo_sum - chain_stats.spent_txo_sum;
    return Bitcoin._satsToBtc(balance);
  }
}
