import { Input } from '../../types';
import { ECDSAWallet } from '../ECDSAWallet';

export class ETC extends ECDSAWallet {
  constructor(input: Input) {
    super(input, 61);
  }

  protected getAddress(evmAddress?: string) {
    return evmAddress as string;
  }

  protected readonly KEY_EVM_WEI_BALANCE = 'b';

  protected readonly KEY_EVM_FORCE_LEGACY_TX = 'fltx';
}
