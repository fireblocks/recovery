/* eslint-disable max-classes-per-file */
import { Bitcoin as BaseBTC, Input } from '@fireblocks/wallet-derivation';
import { CustomElectronLogger } from '@fireblocks/recovery-shared/lib/getLogger';
import { AccountData } from '../types';
import { ConnectedWallet } from '../ConnectedWallet';
import { BTCRelayWallet } from './BTCRelayWallet';
import { BTCRelayWalletUtils, StandardBTCRelayWalletUtils } from './BTCRelayWalletUtils';

export class Bitcoin extends BaseBTC implements ConnectedWallet {
  private static readonly satsPerBtc = 100000000;

  public rpcURL: string | undefined;
  public apiKey: string | null = null;

  private utils: BTCRelayWalletUtils | undefined;

  constructor(input: Input) {
    super(input);
  }

  public setRPCUrl(url: string): void {
    this.rpcURL = url;
    this.utils = new StandardBTCRelayWalletUtils(this.rpcURL, undefined, false, this.apiKey);
  }

  public setAPIKey(apiKey: string | null): void {
    this.apiKey = apiKey;
    this.utils = new StandardBTCRelayWalletUtils(this.rpcURL!, undefined, false, this.apiKey);
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
