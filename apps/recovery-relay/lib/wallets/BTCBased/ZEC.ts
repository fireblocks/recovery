import { ZCash as BaseZEC } from '@fireblocks/wallet-derivation';
import { AccountData } from '../types';
import { ConnectedWallet } from '../ConnectedWallet';
import { BTCRelayWallet } from './BTCRelayWallet';
import { StandardBTCRelayWalletUtils } from './BTCRelayWalletUtils';

export class ZEC extends BaseZEC implements ConnectedWallet {
  private static readonly satsPerBtc = 100000000;

  public rpcURL: string | undefined;
  public apiKey: string | null = null;

  public setRPCUrl(url: string): void {
    this.rpcURL = url;
  }

  public setAPIKey(apiKey: string | null): void {
    this.apiKey = apiKey;
  }

  public async prepare(): Promise<AccountData> {
    const currentBlock = await this._getCurrentBlockHeight();
    const extraParams = new Map<string, string>();
    extraParams.set(this.KEY_EXPIRY_HEIGHT, `${currentBlock + 20}`);

    return { ...(await BTCRelayWallet.prototype.prepare.bind(this)()), extraParams };
  }

  public async broadcastTx(txHex: string): Promise<string> {
    return BTCRelayWallet.prototype.broadcastTx.bind(this)(txHex);
  }

  public async getBalance() {
    return BTCRelayWallet.prototype.getBalance.bind(this)();
  }

  private async _getCurrentBlockHeight() {
    const utils = new StandardBTCRelayWalletUtils(this.rpcURL!, undefined, false, this.apiKey);
    const stats = await utils.requestJson<{
      data: {
        blocks: number;
        [key: string]: any;
      };
      [key: string]: any;
    }>('/stats');

    return stats.data.blocks;
  }
}
