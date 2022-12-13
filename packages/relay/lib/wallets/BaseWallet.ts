export abstract class BaseWallet {
  public abstract getBalance(): Promise<number>;

  public abstract sendTransaction(
    privateKeyHex: string,
    to: string,
    amount: number
  ): Promise<string>;
}
