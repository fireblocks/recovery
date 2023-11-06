import { encodeAddress } from 'algosdk';
import { toUtf8Bytes } from 'ethers';
import { Input } from '../../types';
import { EdDSAWallet } from '../EdDSAWallet';

export class Algorand extends EdDSAWallet {
  constructor(input: Input) {
    super(input, 283);
  }

  protected getAddress() {
    const publicKeyBytes = Buffer.from(this.publicKey.replace('0x', ''), 'hex');

    return encodeAddress(publicKeyBytes);
  }

  protected readonly KEY_SUGGESTED_PARAMS = 's';
}
