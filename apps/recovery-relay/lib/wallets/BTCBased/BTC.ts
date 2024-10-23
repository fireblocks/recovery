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

  private utils: BTCRelayWalletUtils | undefined;

  constructor(input: Input) {
    super(input);
    // Legacy requires a custom site
    if (this.isLegacy) {
      // When calling any custom function provided as part of the relay wallet utils
      // we bind it to `this` from the BTCRelayWallet class, thus every internal reference to this
      // within the custom functions must be considered as a call to the BTCRelayWalletUtils and not
      // overarching wallet type (BSV in this case)

      this.utils = new (class {
        btcWalletUtils;

        constructor(baseUrl: string) {
          this.btcWalletUtils = new StandardBTCRelayWalletUtils(baseUrl);
        }

        async getAddressUTXOs(address: string): Promise<StandardUTXO[]> {
          const utxoSummary = await this.btcWalletUtils.requestJson.bind(this)<UTXOSummary[]>(`/address/${address}/utxo`);
          return utxoSummary.map((utxo) => ({
            transaction_hash: utxo.txid,
            value: utxo.value,
            index: utxo.vout,
            block_id: utxo.status.block_height ?? -1,
          }));
        }

        async getAddressBalance(address: string): Promise<number> {
          const { chain_stats: chainStats } = await this.btcWalletUtils.requestJson.bind(this)<AddressSummary>(
            `/address/${address}`,
          );
          return chainStats.funded_txo_sum - chainStats.spent_txo_sum;
        }

        async getFeeRate(): Promise<number> {
          const feeEstimate = await this.btcWalletUtils.requestJson.bind(this)<{ [key: string]: number }>('/fee-estimates');
          const feeRate = feeEstimate['3'];
          return feeRate;
        }

        async getLegacyFullUTXO(utxo: StandardUTXO): Promise<BTCLegacyUTXO> {
          const { transaction_hash: hash, index } = utxo;
          const rawTxRes = await this.btcWalletUtils.request(`/tx/${hash}/raw`);
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

        async getSegwitUTXO(utxo: StandardUTXO): Promise<BTCSegwitUTXO> {
          const { transaction_hash: hash, index } = utxo;
          const fullUtxo = await this.btcWalletUtils.requestJson.bind(this)<FullUTXO>(`/tx/${hash}`);
          const { scriptpubkey, value } = fullUtxo.vout[index];

          return {
            hash,
            index,
            witnessUtxo: { script: scriptpubkey, value },
            confirmed: true,
            value: BTCRelayWallet._satsToBtc(value),
          };
        }

        async broadcastTx(txHex: string, logger: CustomElectronLogger): Promise<string> {
          try {
            const txBroadcastRes = await this.btcWalletUtils.request('/tx', {
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
        }
      })(this.isTestnet ? 'https://blockstream.info/testnet/api' : 'https://blockstream.info/api') as BTCRelayWalletUtils;
    }
  }

  public setRPCUrl(url: string): void {
    this.rpcURL = url;
  }

  public async getBalance(): Promise<number> {
    return BTCRelayWallet.prototype.getBalance.bind(this)();
  }

  public async prepare(): Promise<AccountData> {
    return BTCRelayWallet.prototype.prepare.bind(this)();
  }

  public async broadcastTx(txHex: string): Promise<string> {
    return BTCRelayWallet.prototype.broadcastTx.bind(this)(txHex);
  }
}
