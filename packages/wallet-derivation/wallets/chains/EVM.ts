import { Input } from '../../types';
import { ECDSAWallet } from '../ECDSAWallet';

export class EVMWallet extends ECDSAWallet {
  constructor(input: Input) {
    super(input, 60);
  }

  protected getAddress(evmAddress?: string) {
    return evmAddress as string;
  }

  protected readonly KEY_EVM_WEI_BALANCE = 'b';

  protected readonly KEY_EVM_FORCE_LEGACY_TX = 'fltx';
}
