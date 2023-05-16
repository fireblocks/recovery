import { ConnectedWallet as DerivationConnectedWallet } from '@fireblocks/wallet-derivation';
import { AccountData, RawSignature } from './types';

export abstract class ConnectedWallet extends DerivationConnectedWallet {
  public abstract getBalance(): Promise<number>;

  public abstract prepare(): Promise<AccountData>;

  public abstract broadcastTx(txHex: string, signatures: RawSignature[], customUrl?: string): Promise<string>;
}
