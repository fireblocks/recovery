import { PublicKey } from '@solana/web3.js';
import { encodeBase58 } from 'ethers';
import { Input } from '../../types';
import { EdDSAWallet } from '../EdDSAWallet';

export class Solana extends EdDSAWallet {
  protected web3PubKey: PublicKey;

  constructor(input: Input) {
    super(input, 501);

    this.web3PubKey = new PublicKey(Buffer.from(this.publicKey.replace('0x', ''), 'hex'));
  }

  protected getAddress() {
    return encodeBase58(this.publicKey);
  }
}
