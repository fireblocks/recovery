import { DogeCoin as BaseDOGE, Input } from '@fireblocks/wallet-derivation';
import { AccountData } from '../types';
import { ConnectedWallet } from '../ConnectedWallet';
import { BTCRelayWallet } from './BTCRelayWallet';

export class DOGE extends BaseDOGE implements ConnectedWallet {
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
    return BTCRelayWallet.prototype.prepare.bind(this)();
  }

  public async broadcastTx(txHex: string): Promise<string> {
    return BTCRelayWallet.prototype.broadcastTx.bind(this)(txHex);
  }

  public async getBalance() {
    return BTCRelayWallet.prototype.getBalance.bind(this)();
  }
}
