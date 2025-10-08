import { BaseWallet } from '@fireblocks/wallet-derivation';
import { AccountData } from './types';
import { CustomElectronLogger } from '@fireblocks/recovery-shared/lib/getLogger';

export abstract class ConnectedWallet extends BaseWallet {
  public rpcURL: string | undefined;

  public abstract getBalance(): Promise<number>;

  public abstract prepare(to?: string, memo?: string): Promise<AccountData>;

  public abstract broadcastTx(txHex: string, logger?: CustomElectronLogger, assetId?: string | undefined): Promise<string>;

  public abstract setRPCUrl(url: string): void;
}
