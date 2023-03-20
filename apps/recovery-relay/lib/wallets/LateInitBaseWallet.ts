import { BaseWallet } from './BaseWallet';

export abstract class LateInitBaseWallet extends BaseWallet {
  public abstract updateDataEndpoint(endpoint: string): void;
}
