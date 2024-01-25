import { CustomElectronLogger } from '@fireblocks/recovery-shared/lib/getLogger';
import { ipcRenderer } from 'electron';
import { BTCLegacyUTXO, BTCSegwitUTXO } from '../types';
import { BTCRelayWallet } from './BTCRelayWallet';
import { StandardAddressSummary, StandardBlockchainStats, StandardFullUTXO, StandardUTXO } from './types';

export interface BTCRelayWalletUtils {
  getAddressUTXOs: (address: string) => Promise<StandardUTXO[]>;
  getAddressBalance: (address: string) => Promise<number>;
  getFeeRate: () => Promise<number>;
  getLegacyFullUTXO?: (utxo: StandardUTXO) => Promise<BTCLegacyUTXO>;
  getSegwitUTXO: (utxo: StandardUTXO) => Promise<BTCSegwitUTXO | undefined>;
  broadcastTx?: (txHex: string, logger: CustomElectronLogger) => Promise<string>;
}

export class StandardBTCRelayWalletUtils implements BTCRelayWalletUtils {
  constructor(private baseUrl: string, private overrides?: BTCRelayWalletUtils, private fetchOnMain = false) {}

  async request(path: string, init?: RequestInit) {
    let res: Response;
    if (!this.fetchOnMain) {
      // @ts-ignore
      res = await fetch(`${this.baseUrl}${path}`, init);
    } else {
      res = new Response(await ipcRenderer.invoke('main_proc_fetch', `${this.baseUrl}${path}`, init));
    }
    return res;
  }

  async requestJson<T>(path: string, init?: RequestInit) {
    const res = await this.request(path, init);
    const data = await res.json();
    return data as T;
  }

  async getAddressUTXOs(address: string): Promise<StandardUTXO[]> {
    if (this.overrides && this.overrides.getAddressUTXOs) {
      return this.overrides.getAddressUTXOs(address);
    }
    const addressSummary = await this.requestJson<StandardAddressSummary>(`/dashboards/address/${address}?limit=0,10000`);

    return addressSummary.data[address].utxo;
  }

  async getAddressBalance(address: string) {
    if (this.overrides && this.overrides.getAddressBalance) {
      return this.overrides.getAddressBalance(address);
    }
    const { balance } = (await this.requestJson<StandardAddressSummary>(`/dashboards/address/${address}?limit=0,0`)).data[address]
      .address;

    return balance;
  }

  async getFeeRate() {
    if (this.overrides && this.overrides.getFeeRate) {
      return this.overrides.getFeeRate();
    }
    const bcStats = await this.requestJson<StandardBlockchainStats>('/stats');
    const feeRate = bcStats.data.suggested_transaction_fee_per_byte_sat;
    return feeRate;
  }

  async getLegacyFullUTXO(utxo: StandardUTXO): Promise<BTCLegacyUTXO> {
    // ONLY USED IN BTC LEGACY!!! No override
    // if (this.overrides && this.overrides.getLegacyFullUTXO) {
    //   return this.overrides.getLegacyFullUTXO!.bind(this)(utxo);
    // }

    const { transaction_hash: hash, index } = utxo;
    const rawTxRes = await this.request(`/tx/${hash}/raw`);
    const rawTx = await rawTxRes.arrayBuffer();
    const nonWitnessUtxo = Buffer.from(rawTx);

    return {
      hash,
      index,
      nonWitnessUtxo,
      confirmed: true,
      value: BTCRelayWallet._satsToBtc(utxo.value),
    };
  }

  async getSegwitUTXO(utxo: StandardUTXO): Promise<BTCSegwitUTXO | undefined> {
    if (this.overrides && this.overrides.getSegwitUTXO) {
      return this.overrides.getSegwitUTXO(utxo);
    }

    const { transaction_hash: hash, index } = utxo;
    const fullUtxo = await this.requestJson<StandardFullUTXO>(`/dashboards/transaction/${hash}`);
    if (fullUtxo.data[hash].transaction.block_id === -1) {
      return undefined;
    }
    const { script_hex: scriptpubkey, value } = fullUtxo.data[hash].outputs[index];

    return {
      hash,
      index,
      witnessUtxo: { script: scriptpubkey, value },
      confirmed: true,
      value: BTCRelayWallet._satsToBtc(value),
    };
  }

  async broadcastTx(txHex: string, logger: CustomElectronLogger): Promise<string> {
    if (this.overrides && this.overrides.broadcastTx) {
      return this.overrides.broadcastTx(txHex, logger);
    }

    try {
      const txBroadcastRes: {
        data?: { transaction_hash: string; [key: string]: any };
        context: { code: number; error: string; [key: string]: any };
      } = await (
        await this.request('/push/transaction', {
          method: 'POST',
          body: `data=${txHex}`,
          headers: [['Content-Type', 'application/x-www-form-urlencoded']],
        })
      ).json();

      if (!txBroadcastRes.data) {
        throw new Error(txBroadcastRes.context.error);
      }
      const txHash = txBroadcastRes.data!.transaction_hash;
      return txHash;
    } catch (e) {
      logger.error(`BTCBased: Error broadcasting tx: ${JSON.stringify(e, null, 2)}`);
      throw e;
    }
  }
}
