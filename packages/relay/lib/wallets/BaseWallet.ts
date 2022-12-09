export abstract class BaseWallet {
  public abstract getAddress(): Promise<string> | string;

  public abstract getBalance(): Promise<number>;

  public abstract sendTransaction(to: string, amount: number): Promise<string>;
}
