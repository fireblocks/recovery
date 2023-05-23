import { ConnectedWallet } from './ConnectedWallet';

export abstract class LateInitConnectedWallet extends ConnectedWallet {
  public isLateInit(): boolean {
    return true;
  }

  public abstract updateDataEndpoint(endpoint: string): void;

  public abstract getLateInitLabel(): string;
}
