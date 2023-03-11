import { encodeAddress } from 'algosdk';
import { toUtf8Bytes } from 'ethers';
import { Input } from '../../types';
import { EdDSAWallet } from '../EdDSAWallet';

export class Algorand extends EdDSAWallet {
  constructor(input: Input) {
    super(input, 283);
  }

  protected getAddress() {
    const publicKeyBytes = toUtf8Bytes(this.publicKey);

    return encodeAddress(publicKeyBytes);
  }
}
