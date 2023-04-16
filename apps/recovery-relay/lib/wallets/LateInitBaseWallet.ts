import { BaseWallet } from './BaseWallet';

export abstract class LateInitBaseWallet extends BaseWallet {
  public isLateInit(): boolean {
    return true;
  }

  public abstract updateDataEndpoint(endpoint: string): void;
}
