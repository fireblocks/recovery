import { DASH as BaseDASH, Input } from '@fireblocks/wallet-derivation';
import { AccountData } from '../types';
import { ConnectedWallet } from '../ConnectedWallet';
import { BTCRelayWallet } from './BTCRelayWallet';

export class DASH extends BaseDASH implements ConnectedWallet {
  private readonly baseUrl: string;

  constructor(input: Input) {
    super(input);

    if (input.isTestnet) {
      throw new Error('No Dash testnet support.');
    }

    this.baseUrl = 'https://api.blockchair.com/dash';
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
