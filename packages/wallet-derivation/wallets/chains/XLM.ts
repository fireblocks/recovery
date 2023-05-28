import { StrKey } from 'stellar-base';
import { EdDSAWallet } from '../EdDSAWallet';
import { Input } from '../../types';

export class Stellar extends EdDSAWallet {
  constructor(input: Input) {
    super(input, 146); // This is not the same as slip44.
  }

  protected getAddress(): string {
    return StrKey.encodeEd25519PublicKey(Buffer.from(this.publicKey.replace('0x', ''), 'hex'));
  }

  protected readonly KEY_ACCOUNT_ID = 'a';
  protected readonly KEY_SEQUENCE = 's';

  protected readonly MIN_BALANCE_SMALLEST_UNITS = 1;
}
