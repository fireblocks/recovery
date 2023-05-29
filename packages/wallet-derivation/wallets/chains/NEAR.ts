import { Input } from '../../types';
import { EdDSAWallet } from '../EdDSAWallet';

export class Near extends EdDSAWallet {
  constructor(input: Input) {
    super(input, 397);
  }

  protected getAddress(): string {
    return this.publicKey.replace('0x', '');
  }

  protected readonly KEY_NONCE = 'n';
  protected readonly KEY_HASH = 'h';
}
