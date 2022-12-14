import { Network, networks, Psbt } from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import ECPairFactory from "ecpair";
import { Buffer } from "buffer";
import { BaseWallet } from "../BaseWallet";
import { AddressSummary, FullUTXO, UTXOSummary } from "./types";

export class Bitcoin implements BaseWallet {
  private static readonly ECPair = ECPairFactory(ecc);

  private static readonly satsPerBtc = 100000000;

  private static readonly digits = [
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
  ];

  private readonly legacy: boolean;

  private readonly network: Network;

  private readonly baseUrl: string;

  constructor(private readonly address: string, isTestnet: boolean) {
    // Only legacy addresses have upper case chars. If by chance there is no upper case letter (possible), then we also check for tb1 (definite segwit) or for bc1
    this.legacy = !address.startsWith("tb1") && !address.startsWith("bc1");

    for (let i = 0; i < address.length; i++) {
      const char = address.charAt(i);

      this.legacy =
        this.legacy ||
        (char === char.toUpperCase() && !Bitcoin.digits.includes(char));
    }

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
      `/address/${this.address}/utxo`
    );

    return utxoSummary;
  }

  private async _getAddressBalance() {
    const addressSummary = await this._requestJson<AddressSummary>(
      `/address/${this.address}`
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

  private async _addSegwitInput(tx: Psbt, utxo: UTXOSummary) {
    const txHash = utxo.txid;
    const index = utxo.vout;

    const fullUTxo = await this._requestJson<FullUTXO>(`/tx/${txHash}`);

    const { scriptpubkey, value } = fullUTxo.vout[index];

    tx.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        script: Buffer.from(scriptpubkey, "hex"),
        value: value,
      },
    });

    return tx;
  }

  private async _addNonSegwitInput(tx: Psbt, utxo: UTXOSummary) {
    const txHash = utxo.txid;

    const rawTxRes = await this._request(`/tx/${txHash}/raw`);

    const rawTx = await rawTxRes.arrayBuffer();

    const nonWitnessUtxo = Buffer.from(rawTx);

    tx.addInput({
      hash: utxo.txid,
      index: utxo.vout,
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

  public async getBalance() {
    const { chain_stats } = await this._getAddressBalance();

    const balance = chain_stats.funded_txo_sum - chain_stats.spent_txo_sum;

    return Bitcoin._satsToBtc(balance);
  }

  public async sendTransaction(
    privateKeyHex: string,
    to: string,
    amount: number
  ) {
    if (this.legacy && (to.startsWith("tb1") || to.startsWith("bc1"))) {
      throw new Error("Can't transfer from legacy address to SegWit address.");
    }

    const satAmount = Bitcoin._btcToSats(amount);
    const tx = new Psbt({ network: this.network });
    const utxos = await this._getAddressUTXOs();

    for (let i = 0; i < utxos.length; i++) {
      const utxo = utxos[i];

      if (this.legacy) {
        await this._addNonSegwitInput(tx, utxo);
      } else {
        await this._addSegwitInput(tx, utxo);
      }
    }

    const feeRate = await this._getFeeRate();

    const vBytes = this.legacy
      ? 148 * utxos.length + 34 + 10
      : 68 * utxos.length + 31 + 10.5;

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

    const signer = Bitcoin.ECPair.fromPrivateKey(
      Buffer.from(privateKeyHex, "hex")
    );
    tx.signAllInputs(signer);
    tx.finalizeAllInputs();

    const txHex = tx.extractTransaction().toHex();

    const txBroadcastRes = await this._request("/tx", {
      method: "POST",
      body: txHex,
    });

    const txHash = await txBroadcastRes.text();

    return txHash;
  }
}
