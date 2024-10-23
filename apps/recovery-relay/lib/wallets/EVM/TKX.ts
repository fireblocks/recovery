import { EVMWallet as EVMBase, Input } from '@fireblocks/wallet-derivation';
import { LateInitConnectedWallet } from '../LateInitConnectedWallet';
import { AccountData } from '../types';
import { EVM } from '.';

export class TokenX extends EVMBase implements LateInitConnectedWallet {
  private inputDup: Input;

  private subWallet: EVM | undefined;

  public rpcURL: string | undefined;

  public getLateInitLabel() {
    return 'TokenX';
  }

  constructor(input: Input) {
    if (input.isTestnet) {
      throw new Error('No Ronin testnet support.');
    }
    super(input);
    this.inputDup = JSON.parse(JSON.stringify(input)) as Input;
  }

  public setRPCUrl(url: string): void {
    this.rpcURL = url;
    this.updateDataEndpoint(url);
  }

  public async getBalance(): Promise<number> {
    if (this.subWallet === undefined) {
      throw new Error('Wallet not initalized yet');
    }
    return (await this.subWallet!.getBalance()) as number;
  }

  public async prepare(): Promise<AccountData> {
    if (this.subWallet === undefined) {
      throw new Error('Wallet not initalized yet');
    }
    return (await this.subWallet!.prepare()) as AccountData;
  }

  // public async generateTx(to: string, amount: number): Promise<TxPayload> {
  //   if (this.subWallet === undefined) {
  //     throw new Error('Wallet not initalized yet');
  //   }
  //   return (await this.subWallet!.generateTx(to, amount)) as TxPayload;
  // }

  public async broadcastTx(txHex: string): Promise<string> {
    if (this.subWallet === undefined) {
      throw new Error('Wallet not initalized yet');
    }
    return (await this.subWallet!.broadcastTx(txHex)) as string;
  }

  public updateDataEndpoint(url: string): void {
    try {
      this.rpcURL = url;
      this.subWallet = new EVM(this.inputDup, 18888);
      this.subWallet.setRPCUrl(this.rpcURL!);
    } catch (e) {
      this.subWallet = undefined;
      throw new Error(`Failed updating endpoint: ${e}`);
    }
  }
}
