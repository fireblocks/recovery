import { ZCash as BaseZEC, Input } from '@fireblocks/wallet-derivation';
import { AccountData } from '../types';
import { ConnectedWallet } from '../ConnectedWallet';
import { BTCRelayWallet } from './BTCRelayWallet';

export class ZEC extends BaseZEC implements ConnectedWallet {
  private static readonly satsPerBtc = 100000000;

  private readonly baseUrl: string;

  constructor(input: Input) {
    super(input);
    this.baseUrl = 'https://api.blockchair.com/zcash';
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
