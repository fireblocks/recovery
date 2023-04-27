import { bech32 } from 'bech32';
import { BTCWalletBase } from './BTCBase';
import { Input } from '../../types';

export class Luna extends BTCWalletBase {
  constructor(input: Input) {
    super(input, 330);
  }

  protected getAddress(): string {
    return bech32.encode('terra', bech32.toWords(Buffer.from(this.getRipeShaHash(false).replace('0x', ''), 'hex')));
  }

  protected readonly KEY_SEQUENCE = 's';
  protected readonly KEY_FEE_ESTIMATE = 'f';
  protected readonly KEY_CHAIN_ID = 'c';
  protected readonly KEY_ACCOUNT_NUMBER = 'n';
}
