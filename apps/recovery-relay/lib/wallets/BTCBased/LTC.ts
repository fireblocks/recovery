import { networks, Psbt } from 'bitcoinjs-lib';
import { Buffer } from 'buffer';
import { LiteCoin as BaseLTC, Input } from '@fireblocks/wallet-derivation';
import { BlockchairAddressDetails, BlockchairStats, BlockchairTx, BlockchairUTXO } from './types';
import { UTXO, AccountData, TxPayload } from '../types';
import { ConnectedWallet } from '../ConnectedWallet';

export class LTC extends BaseLTC implements ConnectedWallet {
  private static readonly satsPerBtc = 100000000;

  private readonly baseUrl: string;

  constructor(input: Input) {
    super(input);

    if (input.isTestnet) {
      throw new Error('No LiteCoin testnet support.');
    }

    this.baseUrl = 'https://api.blockchair.com/litecoin';
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
    const details = await this._requestJson<BlockchairAddressDetails>(`/dashboards/address/${this.address}`);
    if (details.data === null) {
      if (details.context.code === 430) {
        throw new Error(details.context.error as string);
      }
      throw new Error(`No data for addres ${this.address}`);
    }

    return details.data![0].utxo;
  }

  private async _getFeeRate() {
    const feeEstimate = await this._requestJson<BlockchairStats>('/stats');
    console.info({ feeEstimate });
    const feeRate = feeEstimate.suggested_transaction_fee_per_byte_sat;
    return feeRate;
  }

  private async _addSegwitInput(tx: Psbt, utxo: UTXO) {
    const { txHash } = utxo;
    const { index } = utxo;
    const bcTx = await this._requestJson<BlockchairTx>(`/raw/transaction/${txHash}`);
    const fullUTxo = bcTx.data.decoded_raw_transaction;
    const { scriptPubKey, value } = fullUTxo.vout[index];
    tx.addInput({
      hash: utxo.txHash,
      index: utxo.index,
      witnessUtxo: {
        script: Buffer.from(scriptPubKey.hex, 'hex'),
        value,
      },
    });
    return tx;
  }

  private async _addNonSegwitInput(tx: Psbt, utxo: UTXO) {
    const { txHash } = utxo;
    const bcTx = await this._requestJson<BlockchairTx>(`/raw/transaction/${txHash}`);
    const rawTxRes = bcTx.data.raw_transaction;
    const rawTx = Buffer.from(rawTxRes, 'hex');
    const nonWitnessUtxo = Buffer.from(rawTx);
    tx.addInput({
      hash: utxo.txHash,
      index: utxo.index,
      nonWitnessUtxo,
    });
    return tx;
  }

  private static _satsToBtc(sats: number) {
    return sats / LTC.satsPerBtc;
  }

  private static _btcToSats(btc: number) {
    return btc * LTC.satsPerBtc;
  }

  public async prepare(): Promise<AccountData> {
    const utxos = await this._getAddressUTXOs();
    const balance = LTC._satsToBtc(utxos.map((utxo) => utxo.value).reduce((p, c) => p + c));

    return {
      balance,
      utxos: utxos.map(
        (utxo: BlockchairUTXO) =>
          ({
            txHash: utxo.transaction_hash,
            confirmed: utxo.block_id > 0,
            index: utxo.index,
            value: LTC._satsToBtc(utxo.value),
          } as UTXO),
      ),
    };
  }

  public async generateTx(
    to: string,
    amount: number,
    memo?: string | undefined,
    utxos?: UTXO[] | undefined,
    // additionalParameters?: Map<string, object> | undefined
  ): Promise<TxPayload> {
    const utxosToUse: UTXO[] =
      utxos !== undefined
        ? utxos!
        : (await this._getAddressUTXOs()).map(
            (utxo: BlockchairUTXO) =>
              ({
                txHash: utxo.transaction_hash,
                confirmed: utxo.block_id > 0,
                index: utxo.index,
                value: LTC._satsToBtc(utxo.value),
              } as UTXO),
          );

    const tx = new Psbt({ network: networks.bitcoin });

    for (let i = 0; i < utxosToUse.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await (this.isLegacy ? this._addSegwitInput(tx, utxosToUse[i]) : this._addNonSegwitInput(tx, utxosToUse[i]));
    }

    const feeRate = await this._getFeeRate();
    const satAmount = LTC._btcToSats(amount);
    const vBytes = this.isLegacy ? 148 * utxosToUse.length + 34 + 10 : 68 * utxosToUse.length + 31 + 10.5;
    const fee = feeRate * Math.ceil(vBytes);
    const actualAmount = Math.ceil(satAmount - fee);
    const balance = LTC._btcToSats(await this.getBalance());

    if (fee > satAmount || actualAmount > balance) {
      throw new Error(
        `Insufficient funds. Tried to move ${satAmount} satoshi (after fee: ${actualAmount} satoshi) - current account balance is ${balance}.`,
      );
    }

    tx.addOutput({
      address: to,
      value: actualAmount,
    });

    return {
      tx: tx.toHex(),
      derivationPath: this.pathParts,
    };
  }

  public async broadcastTx(
    txHex: string,
    // signature: RawSignature[],
    // customUrl?: string | undefined
  ): Promise<string> {
    // BTC Tx are automatically signed and resulting hex is signed, so no need to do anything special.
    // const tx = Psbt.fromHex(txHex, { network: this.network });
    const txBroadcastRes = await this._request('/push/transaction', {
      method: 'POST',
      body: txHex,
    });

    const txHash = await txBroadcastRes.text();

    return txHash;
  }

  public async getBalance() {
    return (await this.prepare()).balance;
  }
}
