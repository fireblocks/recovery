import { LiteCoin as BaseLTC, Input } from '@fireblocks/wallet-derivation';
import { AccountData } from '../types';
import { ConnectedWallet } from '../ConnectedWallet';
import { BTCRelayWallet } from './BTCRelayWallet';

export class LTC extends BaseLTC implements ConnectedWallet {
  private static readonly satsPerBtc = 100000000;

  private readonly baseUrl: string;

  constructor(input: Input) {
    super(input);
    this.baseUrl = 'https://api.blockchair.com/litecoin';
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
