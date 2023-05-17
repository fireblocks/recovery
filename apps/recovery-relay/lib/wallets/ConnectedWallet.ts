import { BaseWallet } from '@fireblocks/wallet-derivation';
import { AccountData, RawSignature } from './types';

export abstract class ConnectedWallet extends BaseWallet {
  public abstract getBalance(): Promise<number>;

  public abstract prepare(): Promise<AccountData>;

  public abstract broadcastTx(txHex: string, customUrl?: string): Promise<string>;
}
