import { BaseWallet as DerivationBaseWallet } from '@fireblocks/wallet-derivation';
import { AccountData, RawSignature } from './types';

export abstract class ConnectedWallet extends DerivationBaseWallet {
  public abstract getBalance(): Promise<number>;

  public abstract prepare(): Promise<AccountData>;

  public abstract broadcastTx(txHex: string, signatures: RawSignature[], customUrl?: string): Promise<string>;
}
