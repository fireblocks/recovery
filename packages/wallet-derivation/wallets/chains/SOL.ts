import { encodeBase58 } from 'ethers';
import { Input } from '../../types';
import { EdDSAWallet } from '../EdDSAWallet';

export class Solana extends EdDSAWallet {
  constructor(input: Input) {
    super(input, 501);
  }

  protected getAddress() {
    return encodeBase58(this.publicKey);
  }
}
