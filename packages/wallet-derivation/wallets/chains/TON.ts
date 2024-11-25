import { Input } from '../../types';
import { EdDSAWallet } from '../EdDSAWallet';
import { WalletContractV4 } from '@ton/ton';

export class Ton extends EdDSAWallet {
  constructor(input: Input) {
    super(input, 607);
  }

  protected getAddress() {
    return WalletContractV4.create({
      publicKey: Buffer.from(this.publicKey.replace('0x', ''), 'hex'),
      workchain: 0,
    }).address.toString({
      bounceable: false,
      testOnly: this.isTestnet,
    });
  }
}
