import { Address, Networks, PublicKey } from 'bitcore-lib-cash';
import { ECDSAWallet } from '../ECDSAWallet';
import { Input } from '../../types';

export class BitcoinCash extends ECDSAWallet {
  constructor(input: Input) {
    super(input, 145);
  }

  protected getAddress(): string {
    const addr = Address.fromPublicKey(new PublicKey(this.publicKey), this.isTestnet ? Networks.testnet : Networks.mainnet);
    return addr.toCashAddress();
  }
}
