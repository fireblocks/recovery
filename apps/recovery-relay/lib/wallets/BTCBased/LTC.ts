import { LiteCoin as BaseLTC } from '@fireblocks/wallet-derivation';
import { AccountData } from '../types';
import { ConnectedWallet } from '../ConnectedWallet';
import { BTCRelayWallet } from './BTCRelayWallet';

export class LTC extends BaseLTC implements ConnectedWallet {
  private static readonly satsPerBtc = 100000000;

  public rpcURL: string | undefined;

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
