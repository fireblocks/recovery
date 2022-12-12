export abstract class BaseWallet {
  constructor(publicKeyHex: string, isTestnet: boolean) {}

  public abstract getAddress(): Promise<string> | string;

  public abstract getBalance(): Promise<number>;

  public abstract sendTransaction(
    publicKeyHex: string,
    to: string,
    amount: number
  ): Promise<string>;
}
