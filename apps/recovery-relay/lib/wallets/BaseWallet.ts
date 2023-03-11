import { BaseWallet as DerivationBaseWallet } from '@fireblocks/wallet-derivation';
import { AccountData, RawSignature, TxPayload, UTXO } from './types';

export abstract class BaseWallet extends DerivationBaseWallet {
  public abstract getBalance(): Promise<number>;

  public abstract prepare(): Promise<AccountData>;

  public abstract generateTx(
    to: string,
    amount: number,
    memo?: string,
    utxos?: UTXO[],
    additionalParameters?: Map<string, object>,
  ): Promise<TxPayload>;

  public abstract broadcastTx(txHex: string, signature: RawSignature, customUrl?: string): Promise<string>;
}
