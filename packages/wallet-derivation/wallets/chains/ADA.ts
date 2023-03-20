import blake2b from 'blake2b';
import { bech32 } from 'bech32';
import { Input } from '../../types';
import { EdDSAWallet } from '../EdDSAWallet';

export class Cardano extends EdDSAWallet {
  private stakePubKey: string;

  constructor(input: Input) {
    super(input, 1815);
    // Prevent stack overflow
    if (input.path.changeIndex === 2) {
      this.stakePubKey = '';
      return;
    }
    const stakeInput: Input = {
      ...input,
      path: {
        ...input.path,
        changeIndex: 2,
      },
    };
    const stakeWallet = new Cardano(stakeInput);
    this.stakePubKey = stakeWallet.publicKey.replace('0x', '');
    this.address = this.getAddress();
  }

  protected getAddress(): string {
    // Change index = 2 in ADA means a payment address / wallet / key pair - this is ignored
    if (this.path.changeIndex === 2) {
      return '';
    }
    // First iteration of get address is called from super class (base wallet) and won't work since constructor didn't finish.
    if (this.stakePubKey === undefined) {
      return '';
    }
    const paymentPubKey = this.publicKey.replace('0x', '');
    const [baseAddressBytes, hrp] = this.isTestnet ? [Buffer.from('00', 'hex'), 'addr_test'] : [Buffer.from('01', 'hex'), 'addr'];
    const stakeHash = blake2b(28).update(Buffer.from(this.stakePubKey, 'hex')).digest();
    const paymentHash = blake2b(28).update(Buffer.from(paymentPubKey, 'hex')).digest();

    return bech32.encode(hrp, bech32.toWords(Buffer.concat([baseAddressBytes, paymentHash, stakeHash])), 1023);
  }
}
