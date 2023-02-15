export abstract class BaseWallet {
  protected address: string | undefined;

  public getAddress(): string | undefined {
    return this.address;
  }

  public abstract getBalance(): Promise<number>;

  public abstract prepare(publicAddr: string): Promise<AccountData>;

  public abstract generateTx(
    from: string,
    to: string,
    amount: number,
    memo?: string,
    utxos?: UTXO[],
    additionalParameters?: Map<string, object>
  ): Promise<TxPayload>;

  public abstract broadcastTx(
    txHex: string,
    signature: RawSignature,
    customUrl?: string
  ): Promise<string>;
}
