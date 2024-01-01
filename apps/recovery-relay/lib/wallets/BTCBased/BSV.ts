/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */
// eslint-disable-next-line max-classes-per-file
import { BitcoinSV as BSVBase, Input } from '@fireblocks/wallet-derivation';
import { AccountData, BTCSegwitUTXO } from '../types';
import { ConnectedWallet } from '../ConnectedWallet';
import { BTCRelayWallet } from './BTCRelayWallet';
import { StandardBTCRelayWalletUtils } from './BTCRelayWalletUtils';
import { StandardUTXO, UTXOSummary } from './types';

type BSVUTXO = {
  height: number;
  tx_pos: number;
  tx_hash: string;
  value: number;
};

type BSVAddressSummary = {
  confirmed: number;
};

export class BitcoinSV extends BSVBase implements ConnectedWallet {
  private baseUrl: string = '';

  private utils;

  constructor(input: Input) {
    super(input);
    this.baseUrl = input.isTestnet ? 'https://api.whatsonchain.com/v1/bsv/test' : 'https://api.whatsonchain.com/v1/bsv/main';

    // When calling any custom function provided as part of the relay wallet utils
    // we bind it to `this` from the BTCRelayWallet class, thus every internal reference to this
    // within the custom functions must be considered as a call to the BTCRelayWalletUtils and not
    // overarching wallet type (BSV in this case)
    this.utils = new (class {
      btcUtils;

      constructor(baseUrl: string) {
        this.btcUtils = new StandardBTCRelayWalletUtils(baseUrl, undefined, true);
      }

      async getAddressUTXOs(address: string) {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        // const _this = this as unknown as BTCRelayWalletUtils;
        // @ts-ignore
        const bsvUTXOs = await this.btcUtils.requestJson<{ result: BSVUTXO[] }>(`/address/${address}/confirmed/unspent`);
        return bsvUTXOs.result.map(
          (bsvUtxo) =>
            ({
              transaction_hash: bsvUtxo.tx_hash,
              index: bsvUtxo.tx_pos,
              value: bsvUtxo.value,
              block_id: bsvUtxo.height,
            } as StandardUTXO),
        );
      }

      async getAddressBalance(address: string) {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        // const _this = this as unknown as BTCRelayWalletUtils;
        return (await this.btcUtils.requestJson<BSVAddressSummary>(`/address/${address}/confirmed/balance`)).confirmed;
      }

      async getFeeRate() {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const chainTipHash = (
          await this.btcUtils.requestJson<
            {
              height: number;
              hash: string;
              branchlen: number;
              status: string;
            }[]
          >('/chain/tips')
        ).filter((tip) => tip.status === 'active')[0].hash;
        const medianFee = (
          await this.btcUtils.requestJson<{ [key: string]: any; median_fee: number }>(`/block/hash/${chainTipHash}`)
        ).median_fee;
        return medianFee;
      }

      async getSegwitUTXO(utxo: StandardUTXO): Promise<BTCSegwitUTXO> {
        const scriptpubkey = (
          await this.btcUtils.requestJson<{
            [key: string]: any;
            vout: { [key: string]: any; scriptPubKey: { [key: string]: any; hex: string } }[];
          }>(`/tx/hash/${utxo.transaction_hash}`)
        ).vout[utxo.index].scriptPubKey.hex;

        return {
          hash: utxo.transaction_hash,
          index: utxo.index,
          witnessUtxo: { script: scriptpubkey, value: utxo.value },
          confirmed: true,
          value: BTCRelayWallet._satsToBtc(utxo.value),
        };
      }

      async broadcastTx(txHex: string): Promise<string> {
        const txBroadcastRes = await (
          await this.btcUtils.request('/tx/raw', {
            method: 'POST',
            body: JSON.stringify({ txHex }),
            headers: [['Content-Type', 'application/json']],
          })
        ).json();

        return txBroadcastRes;
      }
    })(this.baseUrl);
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
