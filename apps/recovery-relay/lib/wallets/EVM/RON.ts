import { EVMWallet as EVMBase, Input } from '@fireblocks/wallet-derivation';
import { LateInitBaseWallet } from '../LateInitBaseWallet';
import { AccountData, TxPayload, RawSignature } from '../types';
import { EVM } from '.';

export class Ronin extends EVMBase implements LateInitBaseWallet {
  private inputDup: Input;

  private subWallet: EVM | undefined;

  constructor(input: Input) {
    if (input.isTestnet) {
      throw new Error('No Ronin testnet support.');
    }
    super(input);
    this.inputDup = JSON.parse(JSON.stringify(input)) as Input;
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

  public async generateTx(to: string, amount: number): Promise<TxPayload> {
    if (this.subWallet === undefined) {
      throw new Error('Wallet not initalized yet');
    }
    return (await this.subWallet!.generateTx(to, amount)) as TxPayload;
  }

  public async broadcastTx(txHex: string, sigs: RawSignature[]): Promise<string> {
    if (this.subWallet === undefined) {
      throw new Error('Wallet not initalized yet');
    }
    return (await this.subWallet!.broadcastTx(txHex, sigs)) as string;
  }

  public updateDataEndpoint(endpoint: string): void {
    try {
      this.subWallet = new EVM(this.inputDup, endpoint);
    } catch (e) {
      this.subWallet = undefined;
      throw new Error(`Failed updating endpoint: ${e}`);
    }
  }
}
