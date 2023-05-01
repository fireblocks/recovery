import { Input } from '../../types';
import { ECDSAWallet } from '../ECDSAWallet';

export class EVMWallet extends ECDSAWallet {
  constructor(input: Input) {
    // TODO: Import coin type from assets list
    super(input, 60);
  }

  protected getAddress(evmAddress?: string) {
    return evmAddress as string;
  }
}
