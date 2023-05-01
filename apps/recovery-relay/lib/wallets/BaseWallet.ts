import { BaseWallet as DerivationBaseWallet } from '@fireblocks/wallet-derivation';
import { AccountData, RawSignature } from './types';

export abstract class BaseWallet extends DerivationBaseWallet {
  public abstract getBalance(): Promise<number>;

  public abstract prepare(): Promise<AccountData>;

  public abstract broadcastTx(txHex: string, sigs: RawSignature[], customUrl?: string): Promise<string>;
}
