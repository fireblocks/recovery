/* eslint-disable max-classes-per-file */
import { Bitcoin as BaseBTC, Input } from '@fireblocks/wallet-derivation';
import { CustomElectronLogger } from '@fireblocks/recovery-shared/lib/getLogger';
import { AccountData, BTCLegacyUTXO, BTCSegwitUTXO } from '../types';
import { ConnectedWallet } from '../ConnectedWallet';
import { BTCRelayWallet } from './BTCRelayWallet';
import { BTCRelayWalletUtils, StandardBTCRelayWalletUtils } from './BTCRelayWalletUtils';
import { AddressSummary, FullUTXO, StandardUTXO, UTXOSummary } from './types';

export class Bitcoin extends BaseBTC implements ConnectedWallet {
  private static readonly satsPerBtc = 100000000;

  public rpcURL: string | undefined;
  public apiKey: string | null = null;

  private utils: BTCRelayWalletUtils | undefined;

  constructor(input: Input) {
    super(input);
    if (this.isLegacy) {
      this.initializeUtils();
    }
  }

  private initializeUtils() {
    const btcWalletUtils = new StandardBTCRelayWalletUtils(this.rpcURL!, undefined, false, this.apiKey);
    btcWalletUtils.setAPIKey(this.apiKey);
    this.utils = {
      getAddressUTXOs: async (address: string): Promise<StandardUTXO[]> => {
        const utxoSummary = await btcWalletUtils.requestJson<UTXOSummary[]>(
          `/address/${address}/utxo${this.apiKey ? `?key=${this.apiKey}` : ''}`,
        );
        return utxoSummary.map((utxo) => ({
          transaction_hash: utxo.txid,
          value: utxo.value,
          index: utxo.vout,
          block_id: utxo.status.block_height ?? -1,
        }));
      },

      getAddressBalance: async (address: string): Promise<number> => {
        const { chain_stats: chainStats } = await btcWalletUtils.requestJson<AddressSummary>(
          `/address/${address}${this.apiKey ? `?key=${this.apiKey}` : ''}`,
        );
        return chainStats.funded_txo_sum - chainStats.spent_txo_sum;
      },

      getFeeRate: async (): Promise<number> => {
        const feeEstimate = await btcWalletUtils.requestJson<{ [key: string]: number }>(
          `/fee-estimates${this.apiKey ? `?key=${this.apiKey}` : ''}`,
        );
        return feeEstimate['1'];
      },

      getLegacyFullUTXO: async (utxo: StandardUTXO): Promise<BTCLegacyUTXO> => {
        const { transaction_hash: hash, index } = utxo;
        const rawTxRes = await btcWalletUtils.request(`/tx/${hash}/raw${this.apiKey ? `?key=${this.apiKey}` : ''}`);
        const rawTx = await rawTxRes.arrayBuffer();
        const nonWitnessUtxo = Buffer.from(rawTx);

        return {
          hash,
          index,
          nonWitnessUtxo,
          confirmed: true,
          value: BTCRelayWallet._satsToBtc(utxo.value),
        };
      },

      getSegwitUTXO: async (utxo: StandardUTXO): Promise<BTCSegwitUTXO> => {
        const { transaction_hash: hash, index } = utxo;
        const fullUtxo = await btcWalletUtils.requestJson<FullUTXO>(`/tx/${hash}${this.apiKey ? `?key=${this.apiKey}` : ''}`);
        const { scriptpubkey, value } = fullUtxo.vout[index];

        return {
          hash,
          index,
          witnessUtxo: { script: scriptpubkey, value },
          confirmed: true,
          value: BTCRelayWallet._satsToBtc(value),
        };
      },

      broadcastTx: async (txHex: string, logger: CustomElectronLogger, assetId?: string | undefined): Promise<string> => {
        try {
          const txBroadcastRes = await btcWalletUtils.request(`/tx${this.apiKey ? `?key=${this.apiKey}` : ''}`, {
            method: 'POST',
            body: txHex,
          });

          const txHash = await txBroadcastRes.text();
          if (txHash.length !== 64) {
            throw new Error(txHash);
          }
          return txHash;
        } catch (e) {
          logger.error(`BTC: Error broadcasting tx: ${JSON.stringify(e, null, 2)}`);
          throw e;
        }
      },
    } as BTCRelayWalletUtils;
  }

  public setRPCUrl(url: string): void {
    this.rpcURL = url;
  }

  public setAPIKey(apiKey: string | null): void {
    this.apiKey = apiKey;
    // Reinitialize utils with new API key
    if (this.isLegacy) {
      this.initializeUtils();
    }
  }

  public async getBalance(): Promise<number> {
    return BTCRelayWallet.prototype.getBalance.bind(this)();
  }

  public async prepare(): Promise<AccountData> {
    return BTCRelayWallet.prototype.prepare.bind(this)();
  }

  public async broadcastTx(txHex: string, logger: CustomElectronLogger, assetId?: string | undefined): Promise<string> {
    return BTCRelayWallet.prototype.broadcastTx.bind(this)(txHex, logger, assetId);
  }
}
